const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApiError } = require('../utils/response');

class HomeworkService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async solveHomework(imageBuffer, imageUrl, locale = 'tr', subject = null, gradeLevel = null) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const base64ImageData = imageBuffer.toString('base64');
      
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
      
      // Build context based on subject and grade
      let contextInfo = '';
      if (subject) {
        contextInfo += `Subject: ${subject}. `;
      }
      if (gradeLevel) {
        contextInfo += `Grade Level: ${gradeLevel}. `;
      }
      
      const prompt = `You are a helpful tutor solving homework problems. ${contextInfo}

Analyze the image and solve the homework problem shown. ${langConfig.instructions}.

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
1. Break down the solution into clear, logical steps
2. Each step should build on the previous one
3. Use LaTeX for mathematical expressions
4. Explain each step as if teaching a student
5. Include visual descriptions where helpful
6. Keep explanations clear and age-appropriate
7. Response must be in ${langConfig.language}
8. Ensure the JSON is valid and properly formatted`;

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
      
      // Clean the response to extract JSON
      let jsonResponse;
      try {
        // Remove any markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        jsonResponse = JSON.parse(cleanedText);
      } catch (parseError) {
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