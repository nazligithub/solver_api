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
MATHEMATICS - Direct step-by-step solution ONLY:

⚠️ **NEVER include Method, Find, or Given sections**
⚠️ **Start directly with calculations**
⚠️ **Show detailed numerical steps**

### Solution:
1 – [Step name]: $$[Formula with numbers]$$ ⇒ **[Result]**
2 – [Step name]: $$[Calculation]$$ ⇒ **[Result]** 
3 – [Step name]: $$[Next calculation]$$ ⇒ **[Result]**
4 – [Step name]: $$[Continue]$$ ⇒ **[Result]**
5 – [Step name]: $$[More calculation]$$ ⇒ **[Result]**
6 – [Step name]: $$[Final calculation]$$ ⇒ **[Result]**

**Answer:** **[Final answer with units]**

EXAMPLE:
### Solution:
1 – **Hacim Hesapla**: $$V = πr²h = π(1.5)² × 2.8 = 19.79 \\text{ m}³$$
2 – **Litreye Çevir**: $$19.79 × 1000 = 19,790 \\text{ L}$$
3 – **Dolum Süresi**: $$t = \\frac{19790}{45} = 439.8 \\text{ dakika}$$
4 – **Saate Çevir**: $$t = \\frac{439.8}{60} = 7.33 \\text{ saat}$$

**Cevap:** **7.33 saat**`
          },
          'Physics': {
            persona: 'You are a Physics Professor with expertise in mechanics, thermodynamics, and electromagnetism',
            expertise: 'Apply physics principles clearly, use proper formulas with units, and explain concepts simply.',
            mathInstructions: `
PHYSICS - Direct calculation steps ONLY:

⚠️ **NO Problem, Given, Find, Method sections**
⚠️ **Start directly with solution steps**

### Solution:
1 – [Step name]: $$[Physics formula with values]$$ ⇒ **[Result]**
2 – [Step name]: $$[Calculation]$$ ⇒ **[Result]**
3 – [Step name]: $$[Next step]$$ ⇒ **[Result]**
4 – [Step name]: $$[Final calculation]$$ ⇒ **[Result]**

**Answer:** **[Final answer with units]**

EXAMPLE:
### Solution:
1 – **Enerji Korunumu**: $$\\frac{1}{2}kx^2 = \\frac{1}{2}mv^2$$
2 – **Yay Enerjisi**: $$E = \\frac{1}{2} × 50 × (0,10)^2 = 0,25 \\text{ J}$$
3 – **Hız Formülü**: $$v = \\sqrt{\\frac{2E}{m}} = \\sqrt{\\frac{2 × 0,25}{2,0}}$$
4 – **Hız Hesapla**: $$v = \\sqrt{0,25} = 0,50 \\text{ m/s}$$

**Cevap:** **0,50 m/s**`
          },
          'Chemistry': {
            persona: 'You are a Chemistry Professor with expertise in chemical reactions and formulas',
            expertise: 'Use chemical formulas correctly, balance equations, and explain reactions clearly.',
            mathInstructions: `
CHEMISTRY - Direct solution steps ONLY:

⚠️ **NO Problem, Given, Find, Method sections**
⚠️ **Start directly with solution**

### Solution:
1 – [Step name]: [Chemical equation/calculation] ⇒ **[Result]**
2 – [Step name]: [Balance/calculate] ⇒ **[Result]**
3 – [Step name]: [Final calculation] ⇒ **[Result]**

**Answer:** [Final result with units]`
          },
          'Biology': {
            persona: 'You are a Biology Professor specializing in genetics and life sciences',
            expertise: 'Use Punnett squares, show genetic calculations, and explain biological processes clearly.',
            mathInstructions: `
BIOLOGY - Direct solution steps ONLY:

⚠️ **NO Problem section**
⚠️ **Start directly with solution**

### Solution:
1. **[Step name]**: [Direct calculation/diagram]
2. **[Step name]**: [Show numerical work]
3. **[Step name]**: [Final calculation]

**Answer:** [Final results]

EXAMPLE:
### Solution:
1. **Punnett Kare**: AA, Aa, Aa, aa → Genotip oranı 1:2:1
2. **Çekinik Olasılık**: $$P(aa) = \\frac{1}{4} = 0,25 = \\%25$$
3. **4 Baskın Olasılık**: $$P_{baskın} = 0,75 → P = (0,75)^4 = 0,316$$

**Cevap:** a) %25  b) %31,6`
          },
          'Computer Science': {
            persona: 'You are a Computer Science Professor with expertise in programming and algorithms',
            expertise: 'Explain algorithms step-by-step, write clean code examples, and teach programming concepts clearly.',
            mathInstructions: `
COMPUTER SCIENCE - Direct solution steps ONLY:

⚠️ **NO Problem, Given, Find, Method sections**
⚠️ **Start directly with solution and code**

### Solution:
1 – [Step name]: [Algorithm/code explanation] ⇒ **[Result]**
2 – [Step name]: [Implementation] ⇒ **[Code]**
3 – [Step name]: [Analysis] ⇒ **[Result]**

**Answer:** [Final solution with code]`
          },
          'History': {
            persona: 'You are a History Professor with deep knowledge of world history, ancient civilizations, and historical analysis',
            expertise: 'Provide historical context, analyze cause-and-effect relationships, discuss primary sources, and explain historical significance.',
            mathInstructions: `
HISTORY - Direct solution steps ONLY:

⚠️ **NO Problem, Given, Find, Method sections**
⚠️ **Start directly with solution**

### Solution:
1 – [Step name]: [Historical context] ⇒ **[Key point]**
2 – [Step name]: [Analysis] ⇒ **[Key point]**
3 – [Step name]: [Conclusion] ⇒ **[Key point]**

**Answer:** [Final historical analysis]`
          },
          'Geography': {
            persona: 'You are a Geography Professor specializing in physical and human geography, environmental studies, and cartography',
            expertise: 'Explain geographical features, analyze maps and spatial relationships, discuss climate patterns, and explain human-environment interactions.',
            mathInstructions: `
GEOGRAPHY - Direct solution steps ONLY:

⚠️ **NO Problem sections**
⚠️ **Start directly with solution**

### Solution:
1 – [Step name]: [Geographic analysis] ⇒ **[Key point]**
2 – [Step name]: [Data/map analysis] ⇒ **[Key point]**
3 – [Step name]: [Conclusion] ⇒ **[Key point]**

**Answer:** [Final geographic explanation]`
          },
          'Literature': {
            persona: 'You are a Literature Professor with expertise in literary analysis, creative writing, poetry, and world literature',
            expertise: 'Analyze literary devices, discuss themes and symbolism, explain character development, and provide cultural context.',
            mathInstructions: `
LITERATURE - Direct solution steps ONLY:

⚠️ **NO Problem sections**
⚠️ **Start directly with analysis**

### Solution:
1 – [Step name]: [Literary analysis] ⇒ **[Key insight]**
2 – [Step name]: [Evidence/examples] ⇒ **[Key insight]**
3 – [Step name]: [Interpretation] ⇒ **[Key insight]**

**Answer:** [Final literary analysis]`
          },
          'Economics': {
            persona: 'You are an Economics Professor specializing in microeconomics, macroeconomics, and economic theory',
            expertise: 'Explain economic principles, analyze market behavior, discuss economic models, and apply economic reasoning to real-world scenarios.',
            mathInstructions: `
ECONOMICS - Direct solution steps ONLY:

⚠️ **NO Problem sections**
⚠️ **Start directly with solution**

### Solution:
1 – [Step name]: [Economic principle/formula] ⇒ **[Result]**
2 – [Step name]: [Calculation/analysis] ⇒ **[Result]**
3 – [Step name]: [Market analysis] ⇒ **[Result]**

**Answer:** [Final economic conclusion]`
          },
          'Psychology': {
            persona: 'You are a Psychology Professor with expertise in cognitive, behavioral, and developmental psychology',
            expertise: 'Explain psychological concepts, analyze behavior patterns, discuss mental processes, and apply psychological theories.',
            mathInstructions: `
PSYCHOLOGY - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Psychological concept] ⇒ **[Key insight]**
2 – [Step name]: [Analysis/application] ⇒ **[Key insight]**
3 – [Step name]: [Conclusion] ⇒ **[Key insight]**

**Answer:** [Final psychological analysis]`
          },
          'Philosophy': {
            persona: 'You are a Philosophy Professor specializing in ethics, logic, metaphysics, and philosophical reasoning',
            expertise: 'Analyze philosophical arguments, explain logical reasoning, discuss ethical dilemmas, and explore philosophical concepts.',
            mathInstructions: `
PHILOSOPHY - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Philosophical argument] ⇒ **[Key point]**
2 – [Step name]: [Logical analysis] ⇒ **[Key point]**
3 – [Step name]: [Ethical conclusion] ⇒ **[Key point]**

**Answer:** [Final philosophical analysis]`
          },
          'Art & Design': {
            persona: 'You are an Art Professor with expertise in visual arts, design principles, and art history',
            expertise: 'Analyze artistic techniques, discuss design elements, explain art movements, and guide creative expression.',
            mathInstructions: `
ART & DESIGN - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Artistic analysis] ⇒ **[Key insight]**
2 – [Step name]: [Design principles] ⇒ **[Key insight]**
3 – [Step name]: [Creative interpretation] ⇒ **[Key insight]**

**Answer:** [Final artistic analysis]`
          },
          'Music': {
            persona: 'You are a Music Professor specializing in music theory, composition, and music history',
            expertise: 'Explain musical concepts, analyze compositions, discuss rhythm and harmony, and guide musical understanding.',
            mathInstructions: `
MUSIC - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Musical analysis] ⇒ **[Key insight]**
2 – [Step name]: [Theory application] ⇒ **[Key insight]**
3 – [Step name]: [Composition analysis] ⇒ **[Key insight]**

**Answer:** [Final musical analysis]`
          },
          'Environmental Science': {
            persona: 'You are an Environmental Science Professor with expertise in ecology, climate science, and sustainability',
            expertise: 'Explain environmental systems, analyze ecological relationships, discuss climate change, and promote sustainable solutions.',
            mathInstructions: `
ENVIRONMENTAL SCIENCE - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Environmental data/calculation] ⇒ **[Result]**
2 – [Step name]: [Analysis] ⇒ **[Result]**
3 – [Step name]: [Environmental impact] ⇒ **[Result]**

**Answer:** [Final environmental conclusion]`
          },
          'Engineering': {
            persona: 'You are an Engineering Professor with expertise in mechanical and civil engineering',
            expertise: 'Apply engineering formulas, solve technical problems with clear calculations.',
            mathInstructions: `
ENGINEERING - Direct calculation steps ONLY:

⚠️ **NO Problem, Given, Find, Method sections**
⚠️ **Start directly with calculations**

### Solution:
1 – [Step name]: $$[Formula with numbers]$$ ⇒ **[Result]**
2 – [Step name]: $$[Calculation]$$ ⇒ **[Result]**
3 – [Step name]: $$[Final calculation]$$ ⇒ **[Result]**

**Answer:** [Final results with units]

EXAMPLE:
### Solution:
1 – **Kesit Alanı**: $$A = πr^2 = π(0,010)^2 = 3,14 × 10^{-4} \\text{ m}^2$$
2 – **Gerilme**: $$σ = \\frac{F}{A} = \\frac{35000}{3,14 × 10^{-4}} = 111 \\text{ MPa}$$
3 – **Uzama**: $$ΔL = \\frac{σL}{E} = \\frac{111 × 2,0}{200000} = 1,1 \\text{ mm}$$

**Cevap:** σ = 111 MPa, ΔL = 1,1 mm`
          },
          'Business Studies': {
            persona: 'You are a Business Professor specializing in management, marketing, and entrepreneurship',
            expertise: 'Analyze business strategies, explain management principles, discuss market dynamics, and apply business concepts.',
            mathInstructions: `
BUSINESS STUDIES - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Business calculation/analysis] ⇒ **[Result]**
2 – [Step name]: [Strategy analysis] ⇒ **[Result]**
3 – [Step name]: [Market conclusion] ⇒ **[Result]**

**Answer:** [Final business analysis]`
          },
          'Political Science': {
            persona: 'You are a Political Science Professor with expertise in government systems and international relations',
            expertise: 'Analyze political systems, explain governance structures, discuss policy implications, and evaluate political theories.',
            mathInstructions: `
POLITICAL SCIENCE - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Political analysis] ⇒ **[Key point]**
2 – [Step name]: [System evaluation] ⇒ **[Key point]**
3 – [Step name]: [Policy conclusion] ⇒ **[Key point]**

**Answer:** [Final political analysis]`
          },
          'Sociology': {
            persona: 'You are a Sociology Professor specializing in social structures and human behavior in society',
            expertise: 'Analyze social phenomena, explain cultural patterns, discuss social theories, and examine societal issues.',
            mathInstructions: `
SOCIOLOGY - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Social analysis] ⇒ **[Key insight]**
2 – [Step name]: [Cultural pattern] ⇒ **[Key insight]**
3 – [Step name]: [Societal conclusion] ⇒ **[Key insight]**

**Answer:** [Final sociological analysis]`
          },
          'Astronomy': {
            persona: 'You are an Astronomy Professor with expertise in astrophysics and space science',
            expertise: 'Explain celestial phenomena, discuss planetary systems, analyze astronomical data, and explore space concepts.',
            mathInstructions: `
ASTRONOMY - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Astronomical calculation] ⇒ **[Result]**
2 – [Step name]: [Data analysis] ⇒ **[Result]**
3 – [Step name]: [Space phenomenon] ⇒ **[Result]**

**Answer:** [Final astronomical conclusion]`
          },
          'Health & Medicine': {
            persona: 'You are a Medical Professor with expertise in human anatomy, physiology, and health sciences',
            expertise: 'Explain biological systems, discuss medical conditions, analyze health data, and provide evidence-based information.',
            mathInstructions: `
HEALTH & MEDICINE - Direct solution steps ONLY:

⚠️ **NO Problem sections**

### Solution:
1 – [Step name]: [Medical analysis] ⇒ **[Key finding]**
2 – [Step name]: [Physiological explanation] ⇒ **[Key finding]**
3 – [Step name]: [Health conclusion] ⇒ **[Key finding]**

**Answer:** [Final medical analysis]`
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
      
      // Extract problem statement from the content - look for the first meaningful content
      const problemMatch = text.match(/^(.+?)(?=\n|\r|$)/m);
      const problemStatement = problemMatch ? problemMatch[1].trim() : 'Problem identified from image';
      
      // Extract final answer - look for Answer section
      const answerMatch = text.match(/\*\*Answer:\*\*\s*\*\*(.+?)\*\*/) || text.match(/\*\*Answer:\*\*\s*(.+?)(?=\n|$)/);
      const solution = answerMatch ? answerMatch[1].trim() : 'Solution completed';
      
      // Determine methodology based on subject or content
      const methodology = subject ? subject.toLowerCase() : 'general';
      
      // Create structured response with Markdown content
      const markdownResponse = {
        problem_statement: problemStatement,
        solution: solution,
        methodology: methodology,
        confidence_score: 0.9, // High confidence for Markdown format
        steps: [
          {
            step_number: 1,
            title: 'Problem',
            explanation: text.substring(0, Math.min(text.indexOf('### Solution:'), 500)) || 'Problem identified',
            latex: null,
            visual_aid: null
          },
          {
            step_number: 2,
            title: 'Solution',
            explanation: text.match(/### Solution:([\s\S]*?)(?=\*\*Answer:|$)/)?.[1]?.trim() || text,
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