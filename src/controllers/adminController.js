const { asyncHandler, ApiError, BaseResponse } = require('../utils/response');
const supabase = require('../config/supabase');
// Eğer RLS sorunları yaşıyorsanız, aşağıdaki satırı aktif edin:
// const supabase = require('../config/supabase-admin');

// Hair Styles CRUD
const getAllStyles = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  
  let query = supabase.from('hair_styles').select('*');
  
  if (gender) {
    query = query.eq('gender', gender);
  }
  
  const { data, error } = await query.order('order', { ascending: true });
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Styles fetched successfully', { styles: data })
  );
});

const createStyle = asyncHandler(async (req, res) => {
  const { style_name, gender, prompt_text, description, image_url, is_premium } = req.body;
  
  if (!style_name || !gender || !prompt_text || !description) {
    throw new ApiError('Missing required fields', 400);
  }
  
  // Get the maximum order value
  const { data: maxOrderData } = await supabase
    .from('hair_styles')
    .select('order')
    .order('order', { ascending: false })
    .limit(1);
  
  const maxOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order || 0) : 0;
  
  const { data, error } = await supabase
    .from('hair_styles')
    .insert([{
      style_name,
      gender,
      prompt_text,
      description,
      image_url: image_url || null,
      is_premium: is_premium || false,
      order: maxOrder + 1
    }])
    .select()
    .single();
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.status(201).json(
    BaseResponse.success('Style created successfully', { style: data }, 201)
  );
});

const updateStyle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { style_name, gender, prompt_text, description, image_url, is_premium } = req.body;
  
  const { data, error } = await supabase
    .from('hair_styles')
    .update({
      style_name,
      gender,
      prompt_text,
      description,
      image_url,
      is_premium
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError('Style not found', 404);
    }
    throw new ApiError(500, error.message);
  }
  
  return res.json(
    BaseResponse.success('Style updated successfully', { style: data })
  );
});

const deleteStyle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // First delete related processing history records
  const { error: historyError } = await supabase
    .from('processing_history')
    .delete()
    .eq('style_id', id);
  
  if (historyError) throw new ApiError(500, historyError.message);
  
  // Then delete the style
  const { data, error } = await supabase
    .from('hair_styles')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw new ApiError(error.message, 500);
  
  if (!data || data.length === 0) {
    throw new ApiError('Style not found', 404);
  }
  
  return res.json(
    BaseResponse.success('Style deleted successfully')
  );
});

// Hair Colors CRUD
const getAllColors = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  
  let query = supabase.from('hair_colors').select('*');
  
  if (gender) {
    query = query.eq('gender', gender);
  }
  
  const { data, error } = await query.order('order', { ascending: true });
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Colors fetched successfully', { colors: data })
  );
});

const createColor = asyncHandler(async (req, res) => {
  const { color_name, hex_code, gender, prompt_text, image_url, is_premium } = req.body;
  
  if (!color_name || !gender || !prompt_text) {
    throw new ApiError('Missing required fields', 400);
  }
  
  // Get the maximum order value
  const { data: maxOrderData } = await supabase
    .from('hair_colors')
    .select('order')
    .order('order', { ascending: false })
    .limit(1);
  
  const maxOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order || 0) : 0;
  
  const { data, error } = await supabase
    .from('hair_colors')
    .insert([{
      color_name,
      hex_code: hex_code || null,
      gender,
      prompt_text,
      image_url: image_url || null,
      is_premium: is_premium || false,
      order: maxOrder + 1
    }])
    .select()
    .single();
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.status(201).json(
    BaseResponse.success('Color created successfully', { color: data }, 201)
  );
});

const updateColor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { color_name, hex_code, gender, prompt_text, image_url, is_premium } = req.body;
  
  const { data, error } = await supabase
    .from('hair_colors')
    .update({
      color_name,
      hex_code,
      gender,
      prompt_text,
      image_url,
      is_premium
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError('Color not found', 404);
    }
    throw new ApiError(500, error.message);
  }
  
  return res.json(
    BaseResponse.success('Color updated successfully', { color: data })
  );
});

const deleteColor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // First delete related processing history records
  const { error: historyError } = await supabase
    .from('processing_history')
    .delete()
    .eq('color_id', id);
  
  if (historyError) throw new ApiError(500, historyError.message);
  
  // Then delete the color
  const { data, error } = await supabase
    .from('hair_colors')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw new ApiError(error.message, 500);
  
  if (!data || data.length === 0) {
    throw new ApiError('Color not found', 404);
  }
  
  return res.json(
    BaseResponse.success('Color deleted successfully')
  );
});

// Special Style Creation with AI
const createStyleWithAI = asyncHandler(async (req, res) => {
  const { style_name, gender, reference_image_url } = req.body;
  
  if (!style_name || !gender) {
    throw new ApiError('Style name and gender are required', 400);
  }
  
  // Generate prompt using Gemini
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Create a concise, professional prompt for generating a ${gender} hairstyle image called "${style_name}". Include hair texture, cut style, and color. Keep it under 100 words. Response should be a single paragraph in English.`;
  
  const result = await model.generateContent(prompt);
  const generatedPrompt = result.response.text();
  
  console.log('Generated Prompt:', generatedPrompt);
  console.log('Reference Image URL:', reference_image_url);
  
  // Generate image using Replicate
  const Replicate = (await import('replicate')).default;
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  
  console.log('Style Name:', style_name);
  console.log('Gender:', gender);
  
  let imageUrl;
  
  try {
    if (reference_image_url) {
      // Referans görsel varsa kullan
      console.log('Creating with reference image...');
      
      const output = await replicate.run(
        "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
        {
          input: {
            image: reference_image_url,
            prompt: `Transform to ${style_name} hairstyle`,
            num_inference_steps: 100,
            guidance_scale: 7.5,
            image_guidance_scale: 1.5
          }
        }
      );
      
      console.log('Pix2Pix output:', output);
      imageUrl = Array.isArray(output) ? output[0] : output;
      
    } else {
      // Referans görsel yoksa normal oluştur
      console.log('Creating without reference image...');
      
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: `professional photograph of ${gender} model with ${style_name} hairstyle, ${generatedPrompt.slice(0, 200)}, studio lighting, high quality`,
            negative_prompt: "ugly, deformed, blurry, low quality, bad anatomy, bad hair",
            width: 1024,
            height: 1024,
            num_inference_steps: 50,
            guidance_scale: 7.5
          }
        }
      );
      
      console.log('SDXL output:', output);
      imageUrl = Array.isArray(output) ? output[0] : output;
    }
    
    // Eğer hala stream ise string'e çevir
    if (imageUrl && typeof imageUrl === 'object' && !Array.isArray(imageUrl)) {
      console.log('Converting stream to string...');
      const text = await imageUrl.text ? await imageUrl.text() : String(imageUrl);
      imageUrl = text;
    }
    
  } catch (error) {
    console.error('Image generation error:', error);
    imageUrl = '';
  }
  
  console.log('Final Image URL:', imageUrl);
  console.log('Image URL Type:', typeof imageUrl);
  
  // Create description using Gemini
  const descPrompt = `Create a brief, professional description (2-3 sentences) for a hairstyle called "${style_name}" for ${gender}. Make it appealing for a hair salon app.`;
  const descResult = await model.generateContent(descPrompt);
  const description = descResult.response.text();
  
  // Get the maximum order value
  const { data: maxOrderData } = await supabase
    .from('hair_styles')
    .select('order')
    .order('order', { ascending: false })
    .limit(1);
  
  const maxOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order || 0) : 0;
  
  // Save to database
  const { data, error: dbError } = await supabase
    .from('hair_styles')
    .insert([{
      style_name,
      gender,
      prompt_text: generatedPrompt,
      description,
      image_url: String(imageUrl || ''),
      is_premium: false,
      order: maxOrder + 1
    }])
    .select()
    .single();
  
  if (dbError) throw new ApiError(500, dbError.message);
  
  console.log('Database Insert Result:', data);
  console.log('Final Response:', {
    style: data,
    generated_prompt: generatedPrompt,
    generated_image: imageUrl
  });
  
  return res.status(201).json(
    BaseResponse.success('Style created successfully with AI', { 
      style: data,
      generated_prompt: generatedPrompt,
      generated_image: String(imageUrl || '')
    }, 201)
  );
});

// Processing History CRUD
const getProcessingHistory = asyncHandler(async (req, res) => {
  const { user_id, process_type, status, limit = 100 } = req.query;
  
  let query = supabase
    .from('processing_history')
    .select(`
      *,
      hair_styles(style_name),
      hair_colors(color_name)
    `);
  
  if (user_id) query = query.eq('user_id', user_id);
  if (process_type) query = query.eq('process_type', process_type);
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Processing history fetched successfully', { history: data })
  );
});

// Face Analyses CRUD
const getFaceAnalyses = asyncHandler(async (req, res) => {
  const { user_id, face_shape, status, limit = 100 } = req.query;
  
  let query = supabase.from('face_analyses').select('*');
  
  if (user_id) query = query.eq('user_id', user_id);
  if (face_shape) query = query.eq('face_shape', face_shape);
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Face analyses fetched successfully', { analyses: data })
  );
});

const deleteFaceAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('face_analyses')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw new ApiError(error.message, 500);
  
  if (!data || data.length === 0) {
    throw new ApiError('Face analysis not found', 404);
  }
  
  return res.json(
    BaseResponse.success('Face analysis deleted successfully')
  );
});

// Conversations CRUD
const getConversations = asyncHandler(async (req, res) => {
  const { user_id, is_active, limit = 100 } = req.query;
  
  let query = supabase.from('conversations').select('*');
  
  if (user_id) query = query.eq('user_id', user_id);
  if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
  
  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Conversations fetched successfully', { conversations: data })
  );
});

const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get conversation with messages
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (convError) {
    if (convError.code === 'PGRST116') {
      throw new ApiError('Conversation not found', 404);
    }
    throw new ApiError(convError.message, 500);
  }
  
  // Get messages for this conversation
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });
  
  if (msgError) throw new ApiError(msgError.message, 500);
  
  return res.json(
    BaseResponse.success('Conversation fetched successfully', { 
      conversation,
      messages 
    })
  );
});

const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // First delete all messages
  await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', id);
  
  // Then delete conversation contexts
  await supabase
    .from('conversation_contexts')
    .delete()
    .eq('conversation_id', id);
  
  // Finally delete the conversation
  const { data, error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw new ApiError(error.message, 500);
  
  if (!data || data.length === 0) {
    throw new ApiError('Conversation not found', 404);
  }
  
  return res.json(
    BaseResponse.success('Conversation deleted successfully')
  );
});

// Image Uploads CRUD
const getImageUploads = asyncHandler(async (req, res) => {
  const { user_id, limit = 100 } = req.query;
  
  let query = supabase.from('image_uploads').select('*');
  
  if (user_id) query = query.eq('user_id', user_id);
  
  const { data, error } = await query
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Image uploads fetched successfully', { uploads: data })
  );
});

const deleteImageUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get image info first
  const { data: image, error: imgError } = await supabase
    .from('image_uploads')
    .select('storage_url')
    .eq('id', id)
    .single();
  
  if (imgError) {
    if (imgError.code === 'PGRST116') {
      throw new ApiError('Image not found', 404);
    }
    throw new ApiError(imgError.message, 500);
  }
  
  // Delete from storage if exists
  if (image.storage_url) {
    const path = image.storage_url.split('/').pop();
    await supabase.storage.from('hair-uploads').remove([path]);
  }
  
  // Delete from database
  const { data, error } = await supabase
    .from('image_uploads')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) throw new ApiError(error.message, 500);
  
  return res.json(
    BaseResponse.success('Image deleted successfully')
  );
});

// Dashboard Stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const { count: stylesCount } = await supabase
    .from('hair_styles')
    .select('*', { count: 'exact', head: true });
  
  const { count: colorsCount } = await supabase
    .from('hair_colors')
    .select('*', { count: 'exact', head: true });
  
  const { count: processCount } = await supabase
    .from('processing_history')
    .select('*', { count: 'exact', head: true });
  
  const { data: usersCount } = await supabase
    .from('processing_history')
    .select('user_id')
    .then(result => {
      const uniqueUsers = new Set(result.data?.map(item => item.user_id) || []);
      return { data: uniqueUsers.size };
    });
  
  const { data: recentProcessing } = await supabase
    .from('processing_history')
    .select('*, hair_styles(style_name), hair_colors(color_name)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  const { data: popularStyles } = await supabase
    .from('processing_history')
    .select('style_id, hair_styles(style_name, gender)')
    .not('style_id', 'is', null)
    .then(result => {
      const styleCounts = {};
      result.data?.forEach(item => {
        if (item.style_id && item.hair_styles) {
          const key = item.style_id;
          if (!styleCounts[key]) {
            styleCounts[key] = {
              id: key,
              name: item.hair_styles.style_name,
              gender: item.hair_styles.gender,
              count: 0
            };
          }
          styleCounts[key].count++;
        }
      });
      return { 
        data: Object.values(styleCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) 
      };
    });
  
  return res.json(
    BaseResponse.success('Dashboard stats fetched successfully', {
      stats: {
        totalStyles: stylesCount,
        totalColors: colorsCount,
        totalProcessing: processCount,
        activeUsers: usersCount,
        recentProcessing: recentProcessing || [],
        popularStyles: popularStyles || []
      }
    })
  );
});

// Get app with id = 1
const getFirstApp = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', 1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError('App not found', 404);
    }
    throw new ApiError(error.message, 500);
  }
  
  return res.json(
    BaseResponse.success('App fetched successfully', { app: data })
  );
});

// Update orders for styles
const updateStylesOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    throw new ApiError('Items array is required', 400);
  }
  
  try {
    // Update each item's order
    const updates = items.map(async (item, index) => {
      const { data, error } = await supabase
        .from('hair_styles')
        .update({ order: item.order })
        .eq('id', item.id);
      
      if (error) throw error;
      return data;
    });
    
    await Promise.all(updates);
    
    return res.json(
      BaseResponse.success('Styles order updated successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Update orders for colors
const updateColorsOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    throw new ApiError('Items array is required', 400);
  }
  
  try {
    // Update each item's order
    const updates = items.map(async (item, index) => {
      const { data, error } = await supabase
        .from('hair_colors')
        .update({ order: item.order })
        .eq('id', item.id);
      
      if (error) throw error;
      return data;
    });
    
    await Promise.all(updates);
    
    return res.json(
      BaseResponse.success('Colors order updated successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

module.exports = {
  getAllStyles,
  createStyle,
  updateStyle,
  deleteStyle,
  updateStylesOrder,
  getAllColors,
  createColor,
  updateColor,
  deleteColor,
  updateColorsOrder,
  createStyleWithAI,
  getProcessingHistory,
  getFaceAnalyses,
  deleteFaceAnalysis,
  getConversations,
  getConversationById,
  deleteConversation,
  getImageUploads,
  deleteImageUpload,
  getDashboardStats,
  getFirstApp
};