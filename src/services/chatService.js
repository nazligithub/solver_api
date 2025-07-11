const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApiError } = require('../utils/response');
const supabase = require('../config/supabase');

class ChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async createConversation(userId, initialMessage = null) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: initialMessage ? initialMessage.substring(0, 50) + '...' : 'Yeni Sohbet',
        last_message: initialMessage
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to create conversation', 500);
    }

    return data;
  }

  async getConversations(userId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch conversations', 500);
    }

    return data;
  }

  async getConversationWithMessages(conversationId, userId) {
    // First check if conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(
          id,
          role,
          content,
          created_at
        ),
        conversation_contexts(
          face_analysis_id,
          face_analyses(
            id,
            face_shape,
            input_image_id,
            image_uploads(storage_url)
          )
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    return conversation;
  }

  async sendMessage(conversationId, userId, message, includeFaceAnalysis = false) {
    // Get conversation with messages
    const conversation = await this.getConversationWithMessages(conversationId, userId);
    
    // Save user message
    await this.saveMessage(conversationId, 'user', message);

    // Prepare chat history for Gemini
    const history = this.prepareHistory(conversation.messages);
    
    // Get system prompt
    const systemPrompt = await this.getSystemPrompt(conversation, includeFaceAnalysis);

    // Create chat with Gemini
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. As Hair GPT, I will help you with hair, hair styles, and face analyses. I will respond in your language and use a friendly tone.' }]
        },
        ...history
      ]
    });

    try {
      // Send message and get response
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const assistantMessage = response.text();

      // Save assistant message
      await this.saveMessage(conversationId, 'assistant', assistantMessage);

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message: assistantMessage.substring(0, 100) + '...',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      return {
        message: assistantMessage,
        conversationId
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new ApiError('Failed to process chat message', 500);
    }
  }

  async saveMessage(conversationId, role, content) {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      });

    if (error) {
      throw new ApiError('Failed to save message', 500);
    }
  }

  async addFaceAnalysisContext(conversationId, faceAnalysisId) {
    const { error } = await supabase
      .from('conversation_contexts')
      .insert({
        conversation_id: conversationId,
        face_analysis_id: faceAnalysisId
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw new ApiError('Failed to add face analysis context', 500);
    }
  }

  prepareHistory(messages) {
    if (!messages || messages.length === 0) return [];
    
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  async getSystemPrompt(conversation, includeFaceAnalysis) {
    let prompt = `You are Hair GPT, a hair and beauty assistant. You help users with hair styles, hair colors, and face shape analyses.
    
Your tasks:
1. Provide recommendations about hair styles and colors
2. Suggest hairstyles suitable for face shapes
3. Give hair care advice
4. Answer user questions in a friendly and helpful manner

Rules:
- Respond in the same language as the user
- Use a friendly and warm tone
- Keep responses concise and clear
- Be professional but approachable`;

    if (includeFaceAnalysis && conversation.conversation_contexts && conversation.conversation_contexts.length > 0) {
      const latestAnalysis = conversation.conversation_contexts[0];
      if (latestAnalysis.face_analyses) {
        prompt += `\n\nUser's latest face analysis information:
- Face Shape: ${latestAnalysis.face_analyses.face_shape}
- Image: ${latestAnalysis.face_analyses.image_uploads?.storage_url || 'Not available'}

Use this information to provide more personalized recommendations.`;
      }
    }

    return prompt;
  }

  async deleteConversation(conversationId, userId) {
    const { error } = await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new ApiError('Failed to delete conversation', 500);
    }
  }
}

module.exports = ChatService;