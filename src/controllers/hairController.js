const UploadService = require('../services/uploadService');
const ReplicateService = require('../services/replicateService');
const GeminiService = require('../services/geminiService');
const { BaseResponse, ApiError, asyncHandler } = require('../utils/response');
const supabase = require('../config/supabase');

const replicateService = new ReplicateService();
const geminiService = new GeminiService();

const changeHairColor = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    throw new ApiError('Please provide an image', 400);
  }

  const { color, gender } = req.body;
  if (!color) {
    throw new ApiError('Please provide a color', 400);
  }

  const userId = req.headers['x-user-id'] || req.ip;
  
  const uploadedImage = await UploadService.processAndUploadImage(req.file, userId);
  
  const processHistory = await replicateService.saveProcessingHistory({
    user_id: userId,
    input_image_id: uploadedImage.id,
    process_type: 'color_change',
    custom_color: color,
    status: 'processing'
  });

  try {
    const result = await replicateService.processColorChange(uploadedImage.url, color, gender);
    const outputUrl = result.output;
    const colorData = result.colorData;
    
    // Save output image to Supabase
    const savedOutputUrl = await UploadService.saveOutputImage(outputUrl, userId, 'color_change');
    
    await supabase
      .from('processing_history')
      .update({
        output_image_url: savedOutputUrl,
        status: 'completed',
        processing_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
        color_id: colorData?.id || null
      })
      .eq('id', processHistory.id);

    res.json(BaseResponse.success('Hair color changed successfully', {
      inputImage: uploadedImage.url,
      outputImage: savedOutputUrl,
      color: color,
      gender: gender,
      colorInfo: colorData,
      processingTime: `${Date.now() - startTime}ms`
    }));
  } catch (error) {
    await supabase
      .from('processing_history')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', processHistory.id);
    
    throw error;
  }
});

const changeHairStyle = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    throw new ApiError('Please provide an image', 400);
  }

  const { styleId, gender } = req.body;
  if (!styleId && !gender) {
    throw new ApiError('Please provide either styleId or gender', 400);
  }

  const userId = req.headers['x-user-id'] || req.ip;
  
  const uploadedImage = await UploadService.processAndUploadImage(req.file, userId);
  
  const processHistory = await replicateService.saveProcessingHistory({
    user_id: userId,
    input_image_id: uploadedImage.id,
    process_type: 'style_change',
    style_id: styleId || null,
    status: 'processing'
  });

  try {
    const result = await replicateService.processStyleChange(uploadedImage.url, styleId, gender);
    const outputUrl = result.output;
    const styleData = result.styleData;
    
    // Save output image to Supabase
    const savedOutputUrl = await UploadService.saveOutputImage(outputUrl, userId, 'style_change');
    
    await supabase
      .from('processing_history')
      .update({
        output_image_url: savedOutputUrl,
        status: 'completed',
        processing_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', processHistory.id);

    res.json(BaseResponse.success('Hair style changed successfully', {
      inputImage: uploadedImage.url,
      outputImage: savedOutputUrl,
      styleId: styleId,
      gender: gender,
      styleInfo: styleData,
      processingTime: `${Date.now() - startTime}ms`
    }));
  } catch (error) {
    await supabase
      .from('processing_history')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', processHistory.id);
    
    throw error;
  }
});

const getHairStyles = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  
  let query = supabase.from('hair_styles').select('*');
  
  if (gender) {
    query = query.eq('gender', gender);
  }
  
  const { data, error } = await query.order('order', { ascending: true });
  
  if (error) {
    throw new ApiError('Failed to fetch hair styles', 500);
  }
  
  res.json(BaseResponse.success('Hair styles fetched successfully', data));
});

const getHairColors = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  
  let query = supabase.from('hair_colors').select('*');
  
  if (gender) {
    query = query.eq('gender', gender);
  }
  
  const { data, error } = await query.order('order', { ascending: true });
  
  if (error) {
    throw new ApiError('Failed to fetch hair colors', 500);
  }
  
  res.json(BaseResponse.success('Hair colors fetched successfully', data));
});

const getProcessingHistory = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  
  const { data, error } = await supabase
    .from('processing_history')
    .select(`
      *,
      image_uploads!input_image_id(storage_url, original_filename),
      hair_styles(style_name, gender),
      hair_colors(color_name, hex_code)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    throw new ApiError('Failed to fetch processing history', 500);
  }
  
  res.json(BaseResponse.success('Processing history fetched successfully', data));
});

const analyzeFaceShape = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    throw new ApiError('Please provide an image', 400);
  }

  const userId = req.headers['x-user-id'] || req.ip;
  const locale = req.headers['accept-language'] || 'tr';
  
  // Compress the image
  const compressedBuffer = await UploadService.compressImage(req.file.buffer);
  
  // Upload to Supabase
  const uploadedImage = await UploadService.processAndUploadImage(req.file, userId);
  
  // Save analysis record
  const { data: analysisRecord, error: insertError } = await supabase
    .from('face_analyses')
    .insert({
      user_id: userId,
      input_image_id: uploadedImage.id,
      status: 'processing'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Face analysis insert error:', insertError);
    throw new ApiError(`Failed to create analysis record: ${insertError.message}`, 500);
  }

  try {
    // Analyze with Gemini
    const analysisResult = await geminiService.analyzeFaceShape(compressedBuffer, uploadedImage.url, locale);
    
    // Extract face shape from analysis
    const faceShape = analysisResult.hair_properties.face_shape.value || 'Unknown';
    
    // Update face analysis record
    await supabase
      .from('face_analyses')
      .update({
        status: 'completed',
        analysis_result: analysisResult,
        face_shape: faceShape,
        processing_time_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisRecord.id);

    res.json(BaseResponse.success('Face shape analyzed successfully', {
      ...analysisResult,
      processingTime: `${Date.now() - startTime}ms`
    }));
  } catch (error) {
    // Update face analysis record with error
    await supabase
      .from('face_analyses')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisRecord.id);
    
    throw error;
  }
});

const getFaceAnalysisHistory = asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] || req.ip;
  
  const { data, error } = await supabase
    .from('face_analyses')
    .select(`
      *,
      image_uploads!input_image_id(storage_url, original_filename)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    throw new ApiError('Failed to fetch face analysis history', 500);
  }
  
  res.json(BaseResponse.success('Face analysis history fetched successfully', data));
});

module.exports = {
  changeHairColor,
  changeHairStyle,
  getHairStyles,
  getHairColors,
  getProcessingHistory,
  analyzeFaceShape,
  getFaceAnalysisHistory
};