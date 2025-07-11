const sharp = require('sharp');
const supabase = require('../config/supabase');
const { ApiError } = require('../utils/response');

class UploadService {
  static async compressImage(buffer, quality = 80) {
    try {
      const compressedBuffer = await sharp(buffer)
        .jpeg({ quality })
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .toBuffer();
      
      return compressedBuffer;
    } catch (error) {
      throw new ApiError('Image compression failed', 400);
    }
  }

  static async uploadToSupabase(buffer, filename) {
    try {
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${filename}`;
      const bucketName = 'hair-images';

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

  static async saveImageRecord(imageData) {
    try {
      const { data, error } = await supabase
        .from('image_uploads')
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
        .from('hair-images')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new ApiError('Failed to upload output image: ' + error.message, 400);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hair-images')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error saving output image:', error);
      throw new ApiError('Failed to save output image', 500);
    }
  }
}

module.exports = UploadService;