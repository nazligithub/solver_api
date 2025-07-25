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
- Show intermediate results clearly

CRITICAL MARKDOWN FORMATTING FOR MATHEMATICS:
- Use rich Markdown with tables, emojis, and LaTeX
- Mathematical expressions in $$LaTeX$$ blocks
- Create calculation tables for step-by-step work
- Use emojis to highlight important information
- Show detailed numerical calculations with visual formatting
- Use bold **text** for emphasis and final answers`
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

${mathInstructions}

🎯 TASK: Analyze the image and solve the homework problem shown. ${langConfig.instructions}.

📋 SOLUTION APPROACH:

1) 🔢 If the question is NUMERICAL (Math, Physics, Chemistry, Economics, etc.):
   
   📊 **FORMAT REQUIREMENTS:**
   • Use tables for organizing data when dealing with multiple values
   • Show EVERY single calculation step with actual numbers
   • Include units in EVERY calculation step
   • Use emojis to highlight important steps: ⚠️ for warnings, 💡 for key insights, ✅ for correct results
   • Format complex calculations in clear, numbered steps
   • Show substitution of actual values into formulas step by step
   
   📝 **STEP-BY-STEP PROCESS:**
   • 📋 List ALL given data in a table format if multiple values exist
   • 🎯 Clearly state what needs to be found
   • 📐 Choose appropriate formulas and explain WHY they apply
   • 🔢 Show numerical substitution: F = ma → F = 5kg × 2m/s² = 10N
   • 🧮 Break complex calculations into micro-steps with intermediate results
   • ⚠️ Add warning notes for common mistakes
   • ✅ Final answer in bold with proper units
   
   📊 **CALCULATION FORMAT EXAMPLE:**
   | Given Data | Value | Unit |
   |------------|--------|------|
   | Mass (m)   | 5      | kg   |
   | Acceleration (a) | 2 | m/s² |
   
   💡 **Step-by-step calculation:**
   - Formula: F = ma
   - Substitution: F = 5 kg × 2 m/s²
   - Calculation: F = 10 kg⋅m/s²
   - ✅ **Final Answer: F = 10 N**

2) 📚 If the question is VERBAL/THEORETICAL (History, Literature, Biology theory, etc.):
   
   📝 **FORMAT REQUIREMENTS:**
   • Use emojis to categorize information: 📖 for definitions, 🏛️ for historical context, 🔬 for scientific processes
   • Create tables for comparisons, timelines, or categorized information
   • Use bullet points with emojis for better visual organization
   • Include relevant examples with 💡 emoji
   
   📋 **STRUCTURED APPROACH:**
   • 🎯 Start with a clear topic overview (1-2 sentences)
   • 📊 Use tables for organizing complex information:
   
   | Aspect | Details | Example |
   |---------|---------|---------|
   | Concept | Definition | Real-world case |
   
   • 📝 Break explanation into clear sections with emojis:
     - 📖 **Definition/Background**
     - 🔍 **Analysis/Process** 
     - 💡 **Key Examples**
     - 🎯 **Conclusion/Summary**
   
   • ⚠️ Add important notes or common misconceptions
   • ✅ End with key takeaways

3) 🌐 **Language & Formatting:**
   • Detect question language and respond in the SAME language
   • Use rich Markdown formatting: tables, bold headings, bullet lists
   • LaTeX for math: \\( x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} \\)
   • Emojis for better visual appeal and categorization

4) 📐 **Output Structure (ALWAYS follow this):**
   🔍 **Step 1 – Understand the Problem**
   📋 **Step 2 – Plan & Organize**  
   🧮 **Step 3 – Solve Step-by-Step**
   ✅ **Step 4 – Verify & Conclude**

Respond in rich Markdown format with the following structure:

## 🔍 Step 1 – Understand the Problem

📋 **Given Data:**
[Create a table if multiple values, use emojis for organization]

🎯 **Find:** [What needs to be solved]

---

## 📋 Step 2 – Plan & Organize  

📐 **Method:** [Solution approach]

💡 **Formulas:**
$$LaTeX formulas here$$

---

## 🧮 Step 3 – Solve Step-by-Step

🔢 **Calculations:**
[Show EVERY numerical step with tables, emojis, detailed breakdown]

⚠️ **Important Notes:** [Common mistakes to avoid]

---

## ✅ Step 4 – Verify & Conclude

🔍 **Verification:** [Check units, magnitude, reasonableness]

✅ **Final Answer:** **[Result with units]**

💡 **Key Insights:** [Additional notes or alternative methods]

Language: ${langConfig.language}

Use rich Markdown formatting with tables, emojis, LaTeX math, and detailed visual organization.`;

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
      
      // Process Markdown response
      console.log('✨ AI: Processing Markdown solution');
      
      // Extract problem statement from the content
      const problemMatch = text.match(/## 🔍 Step 1[^#]+?🎯 \*\*Find:\*\* (.+?)(?=\n|$)/);
      const problemStatement = problemMatch ? problemMatch[1].trim() : 'Problem identified from image';
      
      // Extract final answer
      const answerMatch = text.match(/✅ \*\*Final Answer:\*\* \*\*(.+?)\*\*/);
      const solution = answerMatch ? answerMatch[1].trim() : 'Solution completed';
      
      // Extract methodology from the method section
      const methodMatch = text.match(/📐 \*\*Method:\*\* (.+?)(?=\n|$)/);
      const methodology = methodMatch ? methodMatch[1].toLowerCase().trim() : 'general';
      
      // Create structured response with Markdown content
      const markdownResponse = {
        problem_statement: problemStatement,
        solution: solution,
        methodology: methodology,
        confidence_score: 0.9, // High confidence for Markdown format
        steps: [
          {
            step_number: 1,
            title: '🔍 Step 1 – Understand the Problem',
            explanation: text.match(/## 🔍 Step 1[^#]+/)?.[0] || '',
            latex: null,
            visual_aid: null
          },
          {
            step_number: 2,
            title: '📋 Step 2 – Plan & Organize',
            explanation: text.match(/## 📋 Step 2[^#]+/)?.[0] || '',
            latex: null,
            visual_aid: null
          },
          {
            step_number: 3,
            title: '🧮 Step 3 – Solve Step-by-Step',
            explanation: text.match(/## 🧮 Step 3[^#]+/)?.[0] || '',
            latex: null,
            visual_aid: null
          },
          {
            step_number: 4,
            title: '✅ Step 4 – Verify & Conclude',
            explanation: text.match(/## ✅ Step 4[^#]+/)?.[0] || '',
            latex: null,
            visual_aid: null
          }
        ],
        full_markdown: text // Store complete Markdown response
      };
      
      // Return formatted response
      console.log('✨ AI: Markdown solution ready');
      return {
        image_url: imageUrl,
        problem_statement: markdownResponse.problem_statement,
        solution: markdownResponse.solution,
        methodology: markdownResponse.methodology,
        confidence_score: markdownResponse.confidence_score,
        steps: markdownResponse.steps,
        locale: locale,
        ai_response: markdownResponse,
        full_markdown: text // Include full Markdown for client use
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