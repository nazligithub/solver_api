const sharp = require('sharp');
const supabase = require('../config/supabase');
const { ApiError } = require('../utils/response');
const circuitBreaker = require('../utils/circuitBreaker');

// Track compression attempts to prevent infinite loops
const compressionAttempts = new Map();
const MAX_COMPRESSION_ATTEMPTS = 3;

// Clean up old compression attempts every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  
  // Clean compression attempts
  for (const [hash, data] of compressionAttempts) {
    if (data.timestamp < fiveMinutesAgo) {
      compressionAttempts.delete(hash);
    }
  }
  
  // Clean upload attempts
  for (const [id, timestamp] of uploadAttempts) {
    if (timestamp < fiveMinutesAgo) {
      uploadAttempts.delete(id);
    }
  }
  
  if (compressionAttempts.size > 0 || uploadAttempts.size > 0) {
    console.log(`🧹 Cleanup: ${compressionAttempts.size} compression, ${uploadAttempts.size} upload attempts remaining`);
  }
}, 5 * 60 * 1000).unref(); // unref() allows process to exit if this is the only timer

class UploadService {
  static async compressImage(buffer, quality = 80) {
    // Use circuit breaker to prevent infinite loops
    const bufferKey = buffer ? `compress-${buffer.length}` : 'compress-invalid';
    
    return circuitBreaker.execute(bufferKey, async () => {
      let metadata;
      try {
      const compressionStart = Date.now();
      const startTime = Date.now();
      const inputSize = buffer.length;
      
      // Create a unique identifier for this buffer
      if (!buffer || buffer.length === 0) {
        console.error('❌ Empty or invalid buffer provided to compressImage');
        throw new Error('Empty buffer');
      }
      
      const bufferHash = `${buffer.length}-${buffer[0]}-${buffer[buffer.length-1]}`;
      const attemptData = compressionAttempts.get(bufferHash) || { count: 0, timestamp: Date.now() };
      
      if (attemptData.count >= MAX_COMPRESSION_ATTEMPTS) {
        console.error(`🚫 Max compression attempts (${MAX_COMPRESSION_ATTEMPTS}) reached for this image`);
        throw new Error('Max compression attempts exceeded');
      }
      
      attemptData.count++;
      attemptData.timestamp = Date.now();
      compressionAttempts.set(bufferHash, attemptData);
      console.log(`🖼️  Compressing image (${(inputSize / 1024 / 1024).toFixed(2)} MB) - Attempt ${attemptData.count}`);
      
      // First, get image metadata to check if it's valid
      try {
        metadata = await sharp(buffer).metadata();
        console.log(`📊 Image info: ${metadata.width}x${metadata.height}, ${metadata.format}`);
      } catch (metadataError) {
        console.error('❌ Invalid image format');
        compressionAttempts.delete(bufferHash); // Clean up on error
        throw new Error('Invalid image format or corrupted file');
      }
      
      // Check if image is too large
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new Error('Image dimensions too large (max 10000x10000)');
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Compression timeout after 30s')), 30000)
      );
      
      // Create sharp instance with error handling
      const sharpInstance = sharp(buffer, {
        failOnError: false,
        limitInputPixels: 268402689 // ~16384x16384
      });
      
      const compressionPromise = sharpInstance
        .jpeg({ 
          quality,
          mozjpeg: true // Use mozjpeg for better compression
        })
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .toBuffer();
      
      const compressedBuffer = await Promise.race([compressionPromise, timeoutPromise]);
      
      const outputSize = compressedBuffer.length;
      const compressionRatio = ((1 - outputSize / inputSize) * 100).toFixed(1);
      console.log(`✅ Compressed in ${Date.now() - startTime}ms (${compressionRatio}% reduction)`);
      
      // Clean up tracking on success
      compressionAttempts.delete(bufferHash);
      
      return compressedBuffer;
      } catch (error) {
        console.error('❌ Compression error:', error.message);
        console.error('Error stack:', error.stack);
        throw new ApiError('Image compression failed: ' + error.message, 400);
      }
    });
  }

  static async uploadToSupabase(buffer, filename) {
    return uploadBufferToSupabase(buffer, filename);
  }

  static async saveImageRecord(imageData) {
    try {
      const { data, error } = await supabase
        .from('homework_image_uploads')
        .insert({
          user_id: imageData.userId,
          original_filename: imageData.originalFilename,
          storage_url: imageData.url,
          file_size: imageData.size,
          mime_type: 'image/jpeg'
        })
        .select()
        .single();

      if (error) {
        throw new ApiError('Failed to save image record: ' + error.message, 500);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Database error', 500);
    }
  }

  static async processAndUploadImage(file, userId) {
    try {
      const compressedBuffer = await this.compressImage(file.buffer);
      
      const uploadResult = await this.uploadToSupabase(
        compressedBuffer,
        file.originalname
      );

      const imageRecord = await this.saveImageRecord({
        userId: userId,
        originalFilename: file.originalname,
        url: uploadResult.url,
        size: compressedBuffer.length
      });

      return {
        id: imageRecord.id,
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: compressedBuffer.length
      };
    } catch (error) {
      throw error;
    }
  }

  static async saveOutputImage(outputUrl, userId, processType) {
    try {
      // Download the image from URL
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new ApiError('Failed to download output image', 400);
      }
      
      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to Supabase in outputs folder
      const timestamp = Date.now();
      const filename = `outputs/${processType}-${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('homework-images')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new ApiError('Failed to upload output image: ' + error.message, 400);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('homework-images')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error saving output image:', error);
      throw new ApiError('Failed to save output image', 500);
    }
  }
}

// Track upload attempts to prevent infinite loops
const uploadAttempts = new Map();

// Standalone function to upload buffer to Supabase
async function uploadBufferToSupabase(buffer, filename) {
  try {
    const uploadStart = Date.now();
    console.log('☁️  Uploading to bucket');
    console.log('📊 Buffer check:', { 
      isBuffer: buffer instanceof Buffer,
      bufferLength: buffer?.length,
      bufferType: typeof buffer
    });
    
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;
    const bucketName = 'homework-images';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFilename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new ApiError('Upload to Supabase failed: ' + error.message, 400);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFilename);

    console.log(`🌐 Upload complete: ${uniqueFilename} (took ${Date.now() - uploadStart}ms)`);
    return {
      url: publicUrl,
      path: data.path,
      filename: uniqueFilename
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Upload failed', 500);
  }
}

// Helper function for direct file upload - renamed to avoid naming conflict
const uploadFileToSupabase = async (file, bucketName = 'homework-images') => {
  console.log('📤 Upload helper called');
  
  // Log where the call is coming from
  const stack = new Error().stack;
  const caller = stack.split('\n')[2];
  if (caller.includes('homeworkController')) {
    console.log('📍 Called from homeworkController');
  } else {
    console.log('📍 Called from:', caller.trim());
  }
  
  // Validate file object
  if (!file) {
    console.error('❌ No file provided to upload helper');
    throw new ApiError('No file provided', 400);
  }
  
  if (!file.buffer) {
    console.error('❌ File has no buffer:', { 
      hasFile: !!file, 
      keys: Object.keys(file || {}),
      bufferType: typeof file.buffer 
    });
    throw new ApiError('Invalid file buffer', 400);
  }
  
  if (!(file.buffer instanceof Buffer)) {
    console.error('❌ File buffer is not a Buffer instance');
    throw new ApiError('File buffer must be a Buffer', 400);
  }
  
  // Create unique ID for this upload attempt
  const uploadId = `${Date.now()}-${file.originalname}-${file.buffer.length}`;
  const attempts = uploadAttempts.get(uploadId) || 0;
  
  if (attempts >= 3) {
    console.error(`🚫 Max upload attempts reached for ${file.originalname}`);
    uploadAttempts.delete(uploadId);
    throw new ApiError('Max upload attempts exceeded', 429);
  }
  
  uploadAttempts.set(uploadId, attempts + 1);
  
  try {
    console.log(`📁 File: ${file.originalname}, Size: ${(file.buffer.length / 1024 / 1024).toFixed(2)} MB, Attempt: ${attempts + 1}`);
    
    // Compress the image first
    const compressionStart = Date.now();
    const compressedBuffer = await UploadService.compressImage(file.buffer);
    const compressionTime = Date.now() - compressionStart;
    
    // Upload to Supabase using the standalone function
    console.log('🔄 Uploading compressed buffer');
    const uploadStart = Date.now();
    const result = await uploadBufferToSupabase(compressedBuffer, file.originalname);
    const uploadTime = Date.now() - uploadStart;
    
    console.log(`📊 Upload breakdown: Compression ${compressionTime}ms + Upload ${uploadTime}ms = ${compressionTime + uploadTime}ms total`);
    
    // Clean up on success
    uploadAttempts.delete(uploadId);
    
    return result;
  } catch (error) {
    // Don't clean up on error - let the attempt counter work
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
};

// Export the class
module.exports = UploadService;

// Export the helper function - keep the name for backward compatibility
// but we'll fix the internal call to avoid conflicts
module.exports.uploadToSupabase = uploadFileToSupabase;