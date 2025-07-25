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
MATHEMATICS FORMAT - Use this EXACT structure with detailed numerical steps:

**Given:** [List the known values]
**Find:** [What to solve for]

**Method:** [Brief approach]

### Calculations:
1 – [Step name]: [Show setup/formula]
2 – [Step name]: [Show substitution]
3 – [Step name]: [Calculate intermediate result]
4 – [Step name]: [Show next calculation]
5 – [Step name]: [Calculate another step] 
6 – [Step name]: [Final calculation]
7 – [Step name]: [Unit conversion if needed]

**Answer:** [Final result with units]

EXAMPLE (Surface Area Minimization):
**Given:** Hacim: x²h = 108 → h = 108/x²
**Find:** Minimum surface area

**Method:** Optimization using calculus

### Calculations:
1 – Denklemleri Kur: $$Hacim: x²h = 108 → h = \\frac{108}{x²}$$
2 – Yüzey Alanı Formülü: $$S(x) = 2x² + 4xh$$
3 – h'yi Yerine Koy: $$S(x) = 2x² + 4x\\left(\\frac{108}{x²}\\right) = 2x² + \\frac{432}{x}$$
4 – Min. için Türevi Al: $$S'(x) = 4x - \\frac{432}{x²}$$
5 – Kritik Noktayı Bul: $$S'(x) = 0 ⇒ 4x = \\frac{432}{x²} ⇒ 4x³ = 432$$
6 – x'i Hesapla: $$x³ = 108 → x = \\sqrt[3]{108} ≈ 4,76 \\text{ m}$$
7 – Minimum Yüzey Alanı: $$S_{min} = 2(4,76)² + \\frac{432}{4,76} ≈ 136 \\text{ m}²$$

**Answer:** Minimum yüzey alanı ≈ 136 m²`
          },
          'Physics': {
            persona: 'You are a Physics Professor with expertise in mechanics, thermodynamics, and electromagnetism',
            expertise: 'Apply physics principles clearly, use proper formulas with units, and explain concepts simply.',
            mathInstructions: `
PHYSICS FORMAT - Use this structure:

**Problem:** [State the physics problem]

**Given:** [List known values with units]
**Find:** [What to calculate]

**Method:** [Physics principle/law]

### Calculations:
1 – [Step name]: [Formula/principle]
2 – [Step name]: [Substitute values]
3 – [Step name]: [Calculate result]
4 – [Step name]: [Final calculation]

**Answer:** [Final result with units]

EXAMPLE:
**Given:** k = 50 N/m, x = 0,10 m, m = 2,0 kg
**Find:** Kütle hangi hızla fırlar?

### Calculations:
1 – Enerji Korunumu: $$\\frac{1}{2}kx^2 = \\frac{1}{2}mv^2$$
2 – Verileri Yerleştir: $$k = 50 \\text{ N/m}, x = 0,10 \\text{ m}, m = 2,0 \\text{ kg}$$
3 – Yay Enerjisi: $$E_{yay} = \\frac{1}{2} \\times 50 \\times (0,10)^2 = 0,25 \\text{ J}$$
4 – Hız Hesabı: $$v = \\sqrt{\\frac{kx^2}{m}} = \\sqrt{\\frac{50(0,10)^2}{2,0}} ≈ 0,50 \\text{ m/s}$$

**Answer:** Kütle 0,50 m/s hızla fırlar`
          },
          'Chemistry': {
            persona: 'You are a Chemistry Professor with expertise in chemical reactions and formulas',
            expertise: 'Use chemical formulas correctly, balance equations, and explain reactions clearly.'
          },
          'Biology': {
            persona: 'You are a Biology Professor specializing in genetics and life sciences',
            expertise: 'Use Punnett squares, show genetic calculations, and explain biological processes clearly.',
            mathInstructions: `
BIOLOGY FORMAT - Use this structure:

**Problem:** [State the biology problem]

### Solution:

1. **[Step name]**
   [Create Punnett square or diagram if needed]
   
2. **[Calculation name]**
   [Show probability calculations]
   
3. **[Result name]**
   [Calculate final probability]

**Answer:** [Final results]

EXAMPLE:
**Problem:** Çekinik bir özelliği (aa) gösteren iki heterozigot (Aa x Aa) birey çaprazlanıyor.

### Solution:

1. **Punnett Kare**
   
   |   | A  | a  |
   |---|----|----|
   | A | AA | Aa |
   | a | Aa | aa |
   
   Genotip oranı: 1AA:2Aa:1aa

2. **a) Çekinik Fenotip**
   $$P(aa) = \\frac{1}{4} = 0,25$$

3. **b) 4 Yavrununun Tamamı Baskın Fenotip**
   Baskın = 1 - 0,25 = 0,75
   $$P = (0,75)^4 ≈ 0,316$$

**Answer:** a) %25  b) ≈ 0,316 (≈ %31,6)`
          },
          'Computer Science': {
            persona: 'You are a Computer Science Professor with expertise in programming and algorithms',
            expertise: 'Explain algorithms step-by-step, write clean code examples, and teach programming concepts clearly.'
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
            persona: 'You are an Engineering Professor with expertise in mechanical and civil engineering',
            expertise: 'Apply engineering formulas, solve technical problems with clear calculations.',
            mathInstructions: `
ENGINEERING FORMAT - Use this structure:

**Problem:** [State the engineering problem]

**Given:** [List specifications and values]
**Find:** [What to calculate]

**Method:** [Engineering principle/formula]

### Calculations:
1 – [Step name]: [Formula and explanation]
2 – [Step name]: [Numerical substitution]
3 – [Step name]: [Calculate intermediate result]

**Answer:** [Final results with units]

EXAMPLE:
**Problem:** Çapı 20 mm olan çelik çubuğa 35 kN eksenel çekme kuvveti uygulanıyor.

**Given:** Çap = 20 mm, F = 35 kN, E = 200 GPa, L = 2,0 m
**Find:** a) Normal gerilme (σ), b) Uzama (ΔL)

### Calculations:
1 – Kesit Alanı: $$A = πr^2$$
   $$r = 10 \\text{ mm} = 0,010 \\text{ m} → A = 3,14 × 10^{-4} \\text{ m}^2$$

2 – Gerilme: $$σ = \\frac{F}{A}$$
   $$σ = \\frac{35000}{3,14 × 10^{-4}} ≈ 111 \\text{ MPa}$$

3 – Uzama: $$Hooke: ε = \\frac{σ}{E}, ΔL = εL$$
   $$ε = \\frac{111 × 10^6}{200 × 10^9} = 5,55 × 10^{-4} ⇒ ΔL = 5,55 × 10^{-4} × 2,0 ≈ 1,1 \\text{ mm}$$

**Answer:** a) σ ≈ 111 MPa  b) ΔL ≈ 1,1 mm`
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
   • Keep solutions concise but complete
   • Show key calculation steps with actual numbers
   • Include units in final results
   • Use minimal emojis: ⚠️ for warnings, ✅ for results
   • Number steps clearly: 1), 2), 3)...
   • Show formula → substitution → result
   
   📝 **STEP-BY-STEP PROCESS:**
   • State given values briefly (table only if 5+ values)
   • Identify what to find
   • Choose formula with brief reason
   • Show calculations step by step
   • Highlight final answer
   
   Example format:
   Given: m = 5 kg, a = 2 m/s²
   Find: Force (F)
   
   Solution:
   1) F = ma
   2) F = 5 × 2 = 10 N
   
   ✅ **Answer: 10 N**

2) 📚 If the question is VERBAL/THEORETICAL (History, Literature, Biology theory, etc.):
   
   📝 **FORMAT REQUIREMENTS:**
   • Use clear headings and bullet points
   • Organize information logically
   • Include relevant examples
   • Keep explanations concise
   
   📋 **STRUCTURED APPROACH:**
   • Start with a brief overview
   • Break into logical sections
   • Use bullet points for clarity
   • Highlight key points with **bold**
   • End with main takeaways

3) 🌐 **Language & Formatting:**
   • Detect question language and respond in the SAME language
   • Use clean Markdown: bold headings, bullet lists
   • LaTeX for math: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
   • Minimal emoji use

4) 📐 **Output Structure (ALWAYS follow this):**
   🔍 **Step 1 – Understand the Problem**
   📋 **Step 2 – Plan & Organize**  
   🧮 **Step 3 – Solve Step-by-Step**
   ✅ **Step 4 – Verify & Conclude**

Respond in clear, concise Markdown format:

## 📝 Problem
[State the problem briefly]

## 🧮 Solution

**Given:** [List key values - use table ONLY if many values]
**Find:** [What to solve]

**Method:** [Brief approach]

### Calculations:
[Show step-by-step work clearly]
- Use $$LaTeX$$ for math
- Number each step
- Show: Step → Calculation → Result
- Highlight important parts with **bold** or ⚠️

### Answer:
✅ **[Final result with units]**

💡 **Note:** [Only if there's an important tip]

Language: ${langConfig.language}

Be CONCISE. NO TABLES. Focus on clear step-by-step calculations.`;

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
      const problemMatch = text.match(/## 📝 Problem\s*\n(.+?)(?=\n|$)/);
      const problemStatement = problemMatch ? problemMatch[1].trim() : 'Problem identified from image';
      
      // Extract final answer
      const answerMatch = text.match(/✅ \*\*(.+?)\*\*/);
      const solution = answerMatch ? answerMatch[1].trim() : 'Solution completed';
      
      // Extract methodology from the method section
      const methodMatch = text.match(/\*\*Method:\*\* (.+?)(?=\n|$)/);
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
            title: '📝 Problem',
            explanation: text.match(/## 📝 Problem[^#]+/)?.[0] || '',
            latex: null,
            visual_aid: null
          },
          {
            step_number: 2,
            title: '🧮 Solution',
            explanation: text.match(/## 🧮 Solution[^#]+/)?.[0] || '',
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