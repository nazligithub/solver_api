const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApiError } = require('../utils/response');

class ChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async sendMessage(userId, message) {
    try {
      // First check if the message is homework-related
      if (!this.isHomeworkRelated(message)) {
        return {
          message: this.getHomeworkOnlyResponse(message),
          userId: userId
        };
      }

      // Get system prompt
      const systemPrompt = await this.getSystemPrompt();

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
            parts: [{ text: 'Understood. I will help you with homework and educational questions. I will respond in your language and use a friendly tone.' }]
          }
        ]
      });

      // Send message and get response
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const assistantMessage = response.text();

      return {
        message: assistantMessage,
        userId: userId
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new ApiError('Failed to process chat message', 500);
    }
  }

  isHomeworkRelated(message) {
    const lowerMessage = message.toLowerCase();
    
    // Homework-related keywords in multiple languages
    const homeworkKeywords = [
      // Turkish
      'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'coğrafya', 'edebiyat', 'ödev', 'soru', 'problem', 'çöz', 'hesapla', 'formül', 'denklem', 'geometri', 'trigonometri', 'algebra', 'kalkülüs', 'integral', 'türev', 'limit', 'fonksiyon', 'grafik', 'sınav', 'test', 'çalışma', 'ders', 'konu', 'açıkla', 'nasıl', 'neden', 'ne', 'hangi', 'kaç', 'kadar', 'fen', 'sayı', 'toplam', 'fark', 'çarpım', 'bölüm', 'üslü', 'kök', 'logaritma', 'sinüs', 'kosinüs', 'tanjant', 'açı', 'üçgen', 'kare', 'dikdörtgen', 'daire', 'alan', 'hacim', 'çevre', 'hız', 'zaman', 'mesafe', 'kuvvet', 'enerji', 'güç', 'elektrik', 'manyetizma', 'ışık', 'ses', 'atom', 'molekül', 'element', 'bileşik', 'reaksiyon', 'asit', 'baz', 'hücre', 'organ', 'sistem', 'evrim', 'kalıtım', 'gen', 'dna', 'rna', 'fotosentez', 'solunum', 'sindirim', 'dolaşım', 'boşaltım', 'sinir', 'hormon', 'üreme', 'gelişim', 'büyüme', 'beslenme', 'sağlık', 'hastalık', 'tedavi', 'ilaç', 'vitamin', 'mineral', 'protein', 'karbonhidrat', 'yağ', 'su', 'oksijen', 'karbon', 'azot', 'hidrojen', 'helyum', 'lityum', 'demir', 'altın', 'gümüş', 'bakır', 'çinko', 'kurşun', 'cıva', 'klor', 'flor', 'brom', 'iyot', 'sodyum', 'potasyum', 'kalsiyum', 'magnezyum', 'alüminyum', 'silikon', 'fosfor', 'sülfür', 'argon', 'neon', 'kripton', 'ksenon', 'radon', 'uranyum', 'plütonyum', 'radyoaktivite', 'nükleer', 'fisyon', 'füzyon', 'radyasyon', 'dalga', 'frekans', 'genlik', 'periyot', 'titreşim', 'resonans', 'interference', 'difraksiyon', 'yansıma', 'kırılma', 'polarizasyon', 'spektrum', 'prizma', 'lens', 'ayna', 'mikroskop', 'teleskop', 'optik',
      
      // English
      'math', 'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'literature', 'homework', 'question', 'problem', 'solve', 'calculate', 'formula', 'equation', 'geometry', 'trigonometry', 'algebra', 'calculus', 'integral', 'derivative', 'limit', 'function', 'graph', 'exam', 'test', 'study', 'lesson', 'topic', 'explain', 'how', 'why', 'what', 'which', 'science', 'number', 'sum', 'difference', 'product', 'quotient', 'power', 'root', 'logarithm', 'sine', 'cosine', 'tangent', 'angle', 'triangle', 'square', 'rectangle', 'circle', 'area', 'volume', 'perimeter', 'speed', 'time', 'distance', 'force', 'energy', 'power', 'electricity', 'magnetism', 'light', 'sound', 'atom', 'molecule', 'element', 'compound', 'reaction', 'acid', 'base', 'cell', 'organ', 'system', 'evolution', 'heredity', 'gene', 'dna', 'rna', 'photosynthesis', 'respiration', 'digestion', 'circulation', 'excretion', 'nervous', 'hormone', 'reproduction', 'development', 'growth', 'nutrition', 'health', 'disease', 'treatment', 'medicine', 'vitamin', 'mineral', 'protein', 'carbohydrate', 'fat', 'water', 'oxygen', 'carbon', 'nitrogen', 'hydrogen', 'helium', 'lithium', 'iron', 'gold', 'silver', 'copper', 'zinc', 'lead', 'mercury', 'chlorine', 'fluorine', 'bromine', 'iodine', 'sodium', 'potassium', 'calcium', 'magnesium', 'aluminum', 'silicon', 'phosphorus', 'sulfur', 'argon', 'neon', 'krypton', 'xenon', 'radon', 'uranium', 'plutonium', 'radioactivity', 'nuclear', 'fission', 'fusion', 'radiation', 'wave', 'frequency', 'amplitude', 'period', 'vibration', 'resonance', 'interference', 'diffraction', 'reflection', 'refraction', 'polarization', 'spectrum', 'prism', 'lens', 'mirror', 'microscope', 'telescope', 'optics',
      
      // Mathematical symbols and operations
      '+', '-', '*', '/', '=', '>', '<', '≥', '≤', '≠', '±', '√', '∞', 'π', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'lim', '∫', '∑', '∆', '∂', '∇', '∈', '∀', '∃', '∧', '∨', '¬', '→', '↔', '∪', '∩', '⊆', '⊇', '∅', 'x', 'y', 'z', 'a', 'b', 'c', 'f(x)', 'g(x)', 'h(x)', 'dy/dx', 'd²y/dx²'
    ];

    // Mathematical patterns
    const mathPatterns = [
      /\d+\s*[\+\-\*\/\=]\s*\d+/,  // Basic arithmetic like "2+3", "x=5"
      /\d+x\s*[\+\-]\s*\d+/,       // Linear equations like "2x+3"
      /x\s*[\+\-\*\/\=]\s*\d+/,    // Variable operations like "x+5"
      /\d+\s*[\+\-]\s*\d+x/,       // Reverse linear like "5+2x"
      /\w+\s*\(\s*\w+\s*\)/,       // Functions like "f(x)", "sin(x)"
      /\d+\^\d+/,                   // Powers like "2^3"
      /√\d+/,                       // Square roots like "√16"
      /\d+\/\d+/,                   // Fractions like "3/4"
      /\(\d+,\d+\)/,               // Coordinates like "(2,3)"
      /\d+°/,                       // Degrees like "45°"
      /\d+\s*cm|mm|m|km|kg|g|l|ml/, // Units
      /\d+\s*%/                     // Percentages
    ];

    // Check for homework keywords
    const hasHomeworkKeywords = homeworkKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Check for mathematical patterns
    const hasMathPatterns = mathPatterns.some(pattern => pattern.test(lowerMessage));
    
    // Check for question indicators
    const questionIndicators = ['?', 'nasıl', 'neden', 'ne', 'hangi', 'kaç', 'how', 'why', 'what', 'which', 'when', 'where', 'çöz', 'solve', 'hesapla', 'calculate', 'bul', 'find', 'göster', 'show', 'açıkla', 'explain'];
    const hasQuestionIndicators = questionIndicators.some(indicator => lowerMessage.includes(indicator));

    // Must have either homework keywords or math patterns, plus question indicators
    return (hasHomeworkKeywords || hasMathPatterns) && hasQuestionIndicators;
  }

  getHomeworkOnlyResponse(message) {
    // Detect language to provide appropriate response
    const lowerMessage = message.toLowerCase();
    const turkishWords = ['merhaba', 'nasılsın', 'naber', 'selam', 'iyi', 'teşekkür', 'sağol', 'günaydın', 'iyi günler', 'iyi akşamlar', 'hava', 'bugün', 'yarın', 'dün'];
    const isTurkish = turkishWords.some(word => lowerMessage.includes(word));
    
    if (isTurkish) {
      return 'Üzgünüm, ben sadece ödev ve eğitim konularında yardım edebilirim. Matematik, fizik, kimya, biyoloji, tarih, coğrafya, edebiyat gibi akademik konularda size yardımcı olabilirim. Lütfen ödevle ilgili bir soru sorun.';
    } else {
      return 'Sorry, I can only help with homework and educational topics. I can assist you with mathematics, physics, chemistry, biology, history, geography, literature, and other academic subjects. Please ask a homework-related question.';
    }
  }

  async getSystemPrompt() {
    return `You are a homework assistant AI. You ONLY help with educational and academic questions.

Your tasks:
1. Solve homework problems step by step
2. Explain academic concepts clearly
3. Help with mathematics, physics, chemistry, biology, history, geography, literature
4. Provide educational guidance and study tips
5. Answer questions about school subjects

Rules:
- ONLY respond to homework and educational questions
- Respond in the same language as the user
- Use a friendly and educational tone
- Provide step-by-step solutions when possible
- Be professional but approachable
- Include examples when helpful

Subjects you can help with:
- Mathematics (algebra, geometry, calculus, statistics)
- Physics (mechanics, electricity, magnetism, optics)
- Chemistry (organic, inorganic, reactions, elements)
- Biology (cells, genetics, evolution, anatomy)
- History (world history, civilizations, events)
- Geography (physical, human, maps, climate)
- Literature (analysis, writing, poetry, novels)
- And other academic subjects

You should NOT help with:
- Personal questions
- Weather or news
- Entertainment topics
- General chat or small talk
- Non-educational content`;
  }
}

module.exports = ChatService;