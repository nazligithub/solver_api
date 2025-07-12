const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApiError } = require('../utils/response');
const db = require('../config/database');

class HomeworkService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async solveHomework(imageBuffer, imageUrl, locale = 'tr', subjectId = null) {
    try {
      console.log('🤖 AI: Processing start');
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const base64ImageData = imageBuffer.toString('base64');
      
      // Fetch subject details if ID is provided
      let subject = null;
      
      if (subjectId) {
        console.log('📖 AI: Loading subject info');
        const subjectResult = await db.query(
          'SELECT name, description FROM subjects WHERE id = $1',
          [subjectId]
        );
        if (subjectResult.rows.length > 0) {
          subject = subjectResult.rows[0].name;
        }
      }
      
      // Language mapping for homework solving
      const languageMap = {
        'tr': {
          language: 'Turkish',
          instructions: 'Türkçe olarak çöz ve açıkla'
        },
        'en': {
          language: 'English',
          instructions: 'Solve and explain in English'
        },
        'es': {
          language: 'Spanish',
          instructions: 'Resuelve y explica en español'
        },
        'fr': {
          language: 'French',
          instructions: 'Résolvez et expliquez en français'
        },
        'de': {
          language: 'German',
          instructions: 'Lösen und erklären Sie auf Deutsch'
        },
        'it': {
          language: 'Italian',
          instructions: 'Risolvi e spiega in italiano'
        },
        'pt': {
          language: 'Portuguese',
          instructions: 'Resolva e explique em português'
        },
        'ru': {
          language: 'Russian',
          instructions: 'Решите и объясните на русском языке'
        },
        'ja': {
          language: 'Japanese',
          instructions: '日本語で解いて説明してください'
        },
        'zh': {
          language: 'Chinese',
          instructions: '用中文解决并解释'
        },
        'ar': {
          language: 'Arabic',
          instructions: 'حل واشرح بالعربية'
        }
      };
      
      // Get language configuration
      const langCode = locale.split('-')[0].toLowerCase();
      const langConfig = languageMap[langCode] || languageMap['en'];
      
      // Build subject-specific persona
      let persona = 'You are a helpful tutor solving homework problems';
      let expertise = '';
      
      if (subject) {
        // Subject-specific personas for better contextual responses
        const subjectPersonas = {
          'Mathematics': {
            persona: 'You are an experienced Mathematics Professor with expertise in algebra, geometry, calculus, statistics, and mathematical problem-solving',
            expertise: 'Use precise mathematical terminology, show clear step-by-step calculations, and explain mathematical concepts thoroughly.'
          },
          'Physics': {
            persona: 'You are a Physics Professor specializing in mechanics, thermodynamics, electromagnetism, optics, and modern physics',
            expertise: 'Apply physics principles, use proper formulas with units, draw force diagrams when needed, and explain physical phenomena clearly.'
          },
          'Chemistry': {
            persona: 'You are a Chemistry Professor with expertise in organic, inorganic, and physical chemistry',
            expertise: 'Use chemical formulas correctly, balance equations, explain chemical reactions and molecular structures, and discuss chemical properties.'
          },
          'Biology': {
            persona: 'You are a Biology Professor specializing in cell biology, genetics, ecology, evolution, and life sciences',
            expertise: 'Explain biological processes in detail, use scientific terminology, discuss cellular mechanisms, and relate concepts to real-world examples.'
          },
          'Computer Science': {
            persona: 'You are a Computer Science Professor with expertise in algorithms, data structures, programming, and computational thinking',
            expertise: 'Explain algorithms step-by-step, write clean code examples, discuss time complexity, and teach programming concepts clearly.'
          },
          'History': {
            persona: 'You are a History Professor with deep knowledge of world history, ancient civilizations, and historical analysis',
            expertise: 'Provide historical context, analyze cause-and-effect relationships, discuss primary sources, and explain historical significance.'
          },
          'Geography': {
            persona: 'You are a Geography Professor specializing in physical and human geography, environmental studies, and cartography',
            expertise: 'Explain geographical features, analyze maps and spatial relationships, discuss climate patterns, and explain human-environment interactions.'
          },
          'Literature': {
            persona: 'You are a Literature Professor with expertise in literary analysis, creative writing, poetry, and world literature',
            expertise: 'Analyze literary devices, discuss themes and symbolism, explain character development, and provide cultural context.'
          },
          'Economics': {
            persona: 'You are an Economics Professor specializing in microeconomics, macroeconomics, and economic theory',
            expertise: 'Explain economic principles, analyze market behavior, discuss economic models, and apply economic reasoning to real-world scenarios.'
          },
          'Psychology': {
            persona: 'You are a Psychology Professor with expertise in cognitive, behavioral, and developmental psychology',
            expertise: 'Explain psychological concepts, analyze behavior patterns, discuss mental processes, and apply psychological theories.'
          },
          'Philosophy': {
            persona: 'You are a Philosophy Professor specializing in ethics, logic, metaphysics, and philosophical reasoning',
            expertise: 'Analyze philosophical arguments, explain logical reasoning, discuss ethical dilemmas, and explore philosophical concepts.'
          },
          'Art & Design': {
            persona: 'You are an Art Professor with expertise in visual arts, design principles, and art history',
            expertise: 'Analyze artistic techniques, discuss design elements, explain art movements, and guide creative expression.'
          },
          'Music': {
            persona: 'You are a Music Professor specializing in music theory, composition, and music history',
            expertise: 'Explain musical concepts, analyze compositions, discuss rhythm and harmony, and guide musical understanding.'
          },
          'Environmental Science': {
            persona: 'You are an Environmental Science Professor with expertise in ecology, climate science, and sustainability',
            expertise: 'Explain environmental systems, analyze ecological relationships, discuss climate change, and promote sustainable solutions.'
          },
          'Engineering': {
            persona: 'You are an Engineering Professor with expertise in mechanical, electrical, and civil engineering principles',
            expertise: 'Apply engineering concepts, solve technical problems, explain design processes, and use mathematical modeling.'
          },
          'Business Studies': {
            persona: 'You are a Business Professor specializing in management, marketing, and entrepreneurship',
            expertise: 'Analyze business strategies, explain management principles, discuss market dynamics, and apply business concepts.'
          },
          'Political Science': {
            persona: 'You are a Political Science Professor with expertise in government systems and international relations',
            expertise: 'Analyze political systems, explain governance structures, discuss policy implications, and evaluate political theories.'
          },
          'Sociology': {
            persona: 'You are a Sociology Professor specializing in social structures and human behavior in society',
            expertise: 'Analyze social phenomena, explain cultural patterns, discuss social theories, and examine societal issues.'
          },
          'Astronomy': {
            persona: 'You are an Astronomy Professor with expertise in astrophysics and space science',
            expertise: 'Explain celestial phenomena, discuss planetary systems, analyze astronomical data, and explore space concepts.'
          },
          'Health & Medicine': {
            persona: 'You are a Medical Professor with expertise in human anatomy, physiology, and health sciences',
            expertise: 'Explain biological systems, discuss medical conditions, analyze health data, and provide evidence-based information.'
          }
        };
        
        const subjectInfo = subjectPersonas[subject] || { persona: persona + `. Subject: ${subject}`, expertise: '' };
        persona = subjectInfo.persona;
        expertise = subjectInfo.expertise;
      }
      
      console.log('🎭 AI: Building prompt for', subject || 'general');
      const prompt = `${persona}

${expertise}

Analyze the image and solve the homework problem shown. ${langConfig.instructions}.

CRITICAL: Keep ALL explanations SHORT and DIRECT. No greetings, no teaching style, just math steps.

IMPORTANT: You must respond with a valid JSON object in the following structure:
{
  "problem_statement": "Clear statement of the problem",
  "solution": "Final answer to the problem",
  "methodology": "Type of solution approach (algebraic, geometric, analytical, etc.)",
  "confidence": 0.95,
  "steps": [
    {
      "step_number": 1,
      "title": "Step title",
      "explanation": "Detailed explanation of this step",
      "latex": "Mathematical expression in LaTeX format if applicable",
      "visual_aid": "Description of any diagram or visual that would help"
    }
  ]
}

Guidelines:
1. Be CONCISE and DIRECT - no greetings or unnecessary text
2. Start each step with the action, not a story
3. Use LaTeX for mathematical expressions
4. Keep explanations SHORT (1-2 sentences max)
5. Focus on the math, not teaching style
6. Avoid phrases like "Hello students", "Let's", "Remember"
7. Response must be in ${langConfig.language}
8. Example of good explanation: "Apply order of operations. Division first."
9. Example of bad explanation: "Hello dear students! Today we'll learn about order of operations which is very important..."`;

      console.log('🚀 AI: Calling Gemini');
      const aiCallStart = Date.now();
      const result = await model.generateContent({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64ImageData,
              }
            },
            {
              text: prompt
            }
          ]
        }]
      });

      const response = await result.response;
      const text = response.text();
      console.log(`📦 AI: Response received (took ${Date.now() - aiCallStart}ms)`);
      
      // Clean the response to extract JSON
      let jsonResponse;
      try {
        // Remove any markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        jsonResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.log('❌ AI: Parse failed');
        console.error('Failed to parse AI response:', text);
        throw new ApiError('Failed to parse homework solution', 500);
      }
      
      // Validate response structure
      if (!jsonResponse.solution || !jsonResponse.steps || !Array.isArray(jsonResponse.steps)) {
        throw new ApiError('Invalid solution format from AI', 500);
      }
      
      // Ensure all steps have required fields
      jsonResponse.steps = jsonResponse.steps.map((step, index) => ({
        step_number: step.step_number || index + 1,
        title: step.title || `Step ${index + 1}`,
        explanation: step.explanation || '',
        latex: step.latex || null,
        visual_aid: step.visual_aid || null
      }));
      
      // Return formatted response
      console.log('✨ AI: Solution ready');
      return {
        image_url: imageUrl,
        problem_statement: jsonResponse.problem_statement || 'Problem identified from image',
        solution: jsonResponse.solution,
        methodology: jsonResponse.methodology || 'general',
        confidence_score: jsonResponse.confidence || 0.85,
        steps: jsonResponse.steps,
        locale: locale,
        ai_response: jsonResponse // Store full response for debugging
      };
    } catch (error) {
      console.log('🔥 AI: Error occurred');
      console.error('Homework solving error:', error);
      throw new ApiError('Failed to solve homework problem', 500);
    }
  }

  // Helper method to format step-by-step solution for client response
  formatSolutionForClient(solutionData) {
    const { solution, steps, confidence_score, methodology } = solutionData;
    
    return {
      result: solution,
      confidence: confidence_score,
      methodology: methodology,
      steps: steps.map(step => ({
        step: step.step_number,
        title: step.title,
        explanation: step.explanation,
        math: step.latex,
        visual: step.visual_aid
      }))
    };
  }
}

module.exports = HomeworkService;