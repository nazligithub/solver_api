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
      let mathInstructions = '';
      
      if (subject) {
        // Subject-specific personas for better contextual responses
        const subjectPersonas = {
          'Mathematics': {
            persona: 'You are an experienced Mathematics Professor with expertise in algebra, geometry, calculus, statistics, and mathematical problem-solving',
            expertise: 'Use precise mathematical terminology, show clear step-by-step calculations, and explain mathematical concepts thoroughly.',
            mathInstructions: `
CRITICAL FOR MATHEMATICAL PROBLEMS:
- Show EVERY numerical calculation step by step
- For each operation, show the numbers being used and the result
- Example: Instead of "Solve 2x + 3 = 7", show:
  Step 1: 2x + 3 = 7
  Step 2: 2x = 7 - 3 = 4
  Step 3: x = 4 ÷ 2 = 2
- For complex calculations, break into micro-steps
- Always show substitution of values into formulas
- Show intermediate results clearly`
          },
          'Physics': {
            persona: 'You are a Physics Professor specializing in mechanics, thermodynamics, electromagnetism, optics, and modern physics',
            expertise: 'Apply physics principles, use proper formulas with units, draw force diagrams when needed, and explain physical phenomena clearly.',
            mathInstructions: `
CRITICAL FOR PHYSICS CALCULATIONS:
- Show ALL numerical substitutions into formulas
- Include units in every calculation step
- Example: F = ma → F = 5kg × 2m/s² = 10N
- Break complex formulas into component calculations
- Show unit conversions step by step`
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
        
        const subjectInfo = subjectPersonas[subject] || { persona: persona + `. Subject: ${subject}`, expertise: '', mathInstructions: '' };
        persona = subjectInfo.persona;
        expertise = subjectInfo.expertise;
        mathInstructions = subjectInfo.mathInstructions || '';
      }
      
      console.log('🎭 AI: Building prompt for', subject || 'general');
      const prompt = `${persona}

${expertise}

Analyze the image and solve the homework problem shown. ${langConfig.instructions}.

SOLUTION APPROACH:

1) If the question is NUMERICAL (Math, Physics, Chemistry, Economics, etc.):
   • List the given data and what is required.  
   • Pick the correct formulas/laws and EXPLAIN why they apply.  
   • Show every calculation line (with units).  
   • If multiple methods exist, pick one elegant path and mention the alternative in one sentence.  
   • Highlight common mistakes in a short "⚠️ Watch out" note.  
   • Finish with **Answer: <result + units>** in bold.

2) If the question is VERBAL/THEORETICAL (History, Literature, Biology theory, etc.):
   • Start with a 1‑sentence overview of the topic.  
   • Break the explanation into clear bullet points or numbered steps (max 7).  
   • Include ONE short real‑world example or analogy.  
   • End with a 2‑line summary (key takeaway).

3) Language:
   • Detect the question language; answer in the SAME language.  
   • Be concise but never skip logical steps.  
   • Use Markdown formatting: equations with LaTeX \\( … \\), bold headings, bullet lists.

4) Output layout (always):
   Step 1 – Understand the Problem
   Step 2 – Plan
   Step 3 – Solve
   Step 4 – Check & Conclude

You MUST respond with ONLY a valid JSON object (no other text) in this exact structure:
{
  "problem_statement": "Exact problem as shown in the image",
  "solution": "Final answer with units if applicable",
  "methodology": "Solution approach (e.g., algebraic, geometric, calculus, etc.)",
  "confidence": 0.95,
  "steps": [
    {
      "step_number": 1,
      "title": "Step 1 – Understand the Problem",
      "explanation": "List given data and what is required",
      "latex": "Mathematical expressions in LaTeX format if applicable",
      "visual_aid": "Any helpful diagram description or null"
    },
    {
      "step_number": 2,
      "title": "Step 2 – Plan",
      "explanation": "Choose formulas/methods and explain why they apply",
      "latex": "Relevant formulas in LaTeX",
      "visual_aid": "Any helpful diagram description or null"
    },
    {
      "step_number": 3,
      "title": "Step 3 – Solve",
      "explanation": "Show every calculation line with units. Include ⚠️ Watch out notes for common mistakes",
      "latex": "Step-by-step calculations in LaTeX",
      "visual_aid": "Any helpful diagram description or null"
    },
    {
      "step_number": 4,
      "title": "Step 4 – Check & Conclude",
      "explanation": "Verify result and state final answer with **Answer: <result + units>** in bold",
      "latex": "Final answer in LaTeX if applicable",
      "visual_aid": "Any helpful diagram description or null"
    }
  ]
}

Language: ${langConfig.language}
Output: ONLY the JSON object, no additional text before or after`;

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
        let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to extract JSON from the text if it's mixed with other content
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        jsonResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.log('❌ AI: Parse failed');
        console.error('Failed to parse AI response:', parseError.message);
        console.error('Raw AI response:', text);
        
        // Try to create a basic response structure from the text
        try {
          // If we can't parse JSON, create a simple response
          const lines = text.split('\n').filter(line => line.trim());
          jsonResponse = {
            problem_statement: "Problem identified from image",
            solution: lines[lines.length - 1] || "Solution could not be extracted",
            methodology: "general",
            confidence: 0.7,
            steps: [{
              step_number: 1,
              title: "Solution",
              explanation: text,
              latex: null,
              visual_aid: null
            }]
          };
        } catch (fallbackError) {
          throw new ApiError('Failed to parse homework solution', 500);
        }
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