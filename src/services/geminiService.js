const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApiError } = require('../utils/response');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async analyzeFaceShape(imageBuffer, imageUrl, locale = 'tr') {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const base64ImageData = imageBuffer.toString('base64');
      
      // Language mapping for face shapes
      const languageMap = {
        'tr': {
          language: 'Turkish',
          faceShapes: 'Oval, Yuvarlak, Kare, Kalp, Üçgen, Dikdörtgen, or Elmas'
        },
        'en': {
          language: 'English',
          faceShapes: 'Oval, Round, Square, Heart, Triangle, Rectangle, or Diamond'
        },
        'es': {
          language: 'Spanish',
          faceShapes: 'Oval, Redonda, Cuadrada, Corazón, Triángulo, Rectángulo, or Diamante'
        },
        'fr': {
          language: 'French',
          faceShapes: 'Ovale, Rond, Carré, Cœur, Triangle, Rectangle, or Diamant'
        },
        'de': {
          language: 'German',
          faceShapes: 'Oval, Rund, Quadratisch, Herz, Dreieck, Rechteck, or Diamant'
        },
        'it': {
          language: 'Italian',
          faceShapes: 'Ovale, Rotondo, Quadrato, Cuore, Triangolo, Rettangolo, or Diamante'
        },
        'pt': {
          language: 'Portuguese',
          faceShapes: 'Oval, Redondo, Quadrado, Coração, Triângulo, Retângulo, or Diamante'
        },
        'ru': {
          language: 'Russian',
          faceShapes: 'Овальное, Круглое, Квадратное, Сердце, Треугольное, Прямоугольное, or Ромбовидное'
        },
        'ja': {
          language: 'Japanese',
          faceShapes: '卵型, 丸型, 四角型, ハート型, 三角型, 長方形, or ダイヤモンド型'
        },
        'zh': {
          language: 'Chinese',
          faceShapes: '椭圆形, 圆形, 方形, 心形, 三角形, 长方形, or 钻石形'
        },
        'ar': {
          language: 'Arabic',
          faceShapes: 'بيضاوي, دائري, مربع, قلب, مثلث, مستطيل, or ماسي'
        }
      };
      
      // Get language configuration
      const langCode = locale.split('-')[0].toLowerCase();
      const langConfig = languageMap[langCode] || languageMap['en'];
      
      const prompt = `Analyze the face shape and provide the following information in ${langConfig.language}:
1. Face shape (ONLY ONE WORD from these options: ${langConfig.faceShapes})
2. Face shape description (2-3 sentences)
3. Hair recommendations (3 items)
4. Styling tips (2 items)
5. Product recommendations (2 items)

IMPORTANT: 
- For item 1, provide ONLY the face shape name (single word), nothing else.
- Respond in ${langConfig.language} language.`;

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
      
      // Parse the response
      const lines = text.split('\n').filter(line => line.trim());
      let faceShape = 'Oval';
      let description = '';
      let recommendations = [];
      let stylingTips = [];
      let products = [];
      
      // Extract information from response
      let currentSection = '';
      lines.forEach((line, index) => {
        const cleanLine = line.replace(/^[0-9]\.\s*/, '').trim();
        
        if (index === 0 || line.includes('1.')) {
          // First line should be face shape - extract only the shape word
          // Support face shapes in all languages
          const allFaceShapes = [
            // Turkish
            'Oval', 'Yuvarlak', 'Kare', 'Kalp', 'Üçgen', 'Dikdörtgen', 'Elmas',
            // English
            'Round', 'Square', 'Heart', 'Triangle', 'Rectangle', 'Diamond',
            // Spanish
            'Redonda', 'Cuadrada', 'Corazón', 'Triángulo', 'Rectángulo', 'Diamante',
            // French
            'Ovale', 'Rond', 'Carré', 'Cœur', 'Triangle', 'Rectangle', 'Diamant',
            // German
            'Rund', 'Quadratisch', 'Herz', 'Dreieck', 'Rechteck', 'Diamant',
            // Italian
            'Rotondo', 'Quadrato', 'Cuore', 'Triangolo', 'Rettangolo', 'Diamante',
            // Portuguese
            'Redondo', 'Quadrado', 'Coração', 'Triângulo', 'Retângulo', 'Diamante',
            // Russian
            'Овальное', 'Круглое', 'Квадратное', 'Сердце', 'Треугольное', 'Прямоугольное', 'Ромбовидное',
            // Japanese
            '卵型', '丸型', '四角型', 'ハート型', '三角型', '長方形', 'ダイヤモンド型',
            // Chinese
            '椭圆形', '圆形', '方形', '心形', '三角形', '长方形', '钻石形',
            // Arabic
            'بيضاوي', 'دائري', 'مربع', 'قلب', 'مثلث', 'مستطيل', 'ماسي'
          ];
          
          // Check if first word is a face shape
          const firstWord = cleanLine.split(' ')[0];
          if (allFaceShapes.includes(firstWord)) {
            faceShape = firstWord;
          } else {
            // Try to find face shape in the line
            const words = cleanLine.split(' ');
            for (const word of words) {
              if (allFaceShapes.includes(word)) {
                faceShape = word;
                break;
              }
            }
          }
        } else if (line.includes('2.')) {
          description = cleanLine;
          currentSection = '';
        } else if (line.includes('3.') || line.toLowerCase().includes('saç önerileri')) {
          currentSection = 'recommendations';
        } else if (line.includes('4.') || line.toLowerCase().includes('şekillendirme')) {
          currentSection = 'styling';
        } else if (line.includes('5.') || line.toLowerCase().includes('ürün')) {
          currentSection = 'products';
        } else if (cleanLine && !line.match(/^[0-9]\./)) {
          // Add to current section
          if (currentSection === 'recommendations' && recommendations.length < 3) {
            recommendations.push(cleanLine.replace(/^[-•*]\s*/, ''));
          } else if (currentSection === 'styling' && stylingTips.length < 2) {
            stylingTips.push(cleanLine.replace(/^[-•*]\s*/, ''));
          } else if (currentSection === 'products' && products.length < 2) {
            products.push(cleanLine.replace(/^[-•*]\s*/, ''));
          }
        }
      });
      
      // Ensure we have valid data
      if (recommendations.length === 0) recommendations = ['Yüz şeklinize uygun kesim önerileri', 'Katmanlı kesimler', 'Modern saç stilleri'];
      if (stylingTips.length === 0) stylingTips = ['Saçınızı doğal şekilde kurutun', 'Hafif şekillendirici ürünler kullanın'];
      if (products.length === 0) products = ['Argan yağlı saç serumu', 'Hafif tutuşlu saç spreyi'];
      
      // Generate JSON response
      return this.generateJsonResponse(faceShape, description, recommendations, stylingTips, products, imageUrl, locale);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new ApiError('Failed to analyze face shape', 500);
    }
  }

  generateJsonResponse(faceShape, description, recommendations, stylingTips, products, imageUrl, locale = 'tr') {
    // Language-specific translations
    const translations = {
      'tr': {
        header_title: "Saç bakımınızı artırmalısınız",
        hair_density_label: "Saç Yoğunluğu",
        hair_type_label: "Saç Tipi",
        face_shape_label: "Yüz Şekli",
        chart_message: "Sadece bir kaç tüyo ile",
        chart_sub_message: "Potansiyelinizin %100'üne erişin!",
        face_analysis_title: "Yüz Analizi",
        recommendations_title: "Saç Önerileri",
        recommendations_intro: "Sadece bir kaç tane öneride bulunmamız gerekirse:",
        styling_title: "Yeni Saç Planınızı Uygulayın",
        products_title: "Detaylar"
      },
      'en': {
        header_title: "Enhance your hair care routine",
        hair_density_label: "Hair Density",
        hair_type_label: "Hair Type",
        face_shape_label: "Face Shape",
        chart_message: "With just a few tips",
        chart_sub_message: "Reach 100% of your potential!",
        face_analysis_title: "Face Analysis",
        recommendations_title: "Hair Recommendations",
        recommendations_intro: "If we had to make just a few suggestions:",
        styling_title: "Apply Your New Hair Plan",
        products_title: "Details"
      },
      'es': {
        header_title: "Mejora tu rutina de cuidado del cabello",
        hair_density_label: "Densidad del Cabello",
        hair_type_label: "Tipo de Cabello",
        face_shape_label: "Forma de Cara",
        chart_message: "Con solo unos consejos",
        chart_sub_message: "¡Alcanza el 100% de tu potencial!",
        face_analysis_title: "Análisis Facial",
        recommendations_title: "Recomendaciones de Cabello",
        recommendations_intro: "Si tuviéramos que hacer solo algunas sugerencias:",
        styling_title: "Aplica tu Nuevo Plan Capilar",
        products_title: "Detalles"
      },
      'fr': {
        header_title: "Améliorez votre routine capillaire",
        hair_density_label: "Densité des Cheveux",
        hair_type_label: "Type de Cheveux",
        face_shape_label: "Forme du Visage",
        chart_message: "Avec quelques conseils",
        chart_sub_message: "Atteignez 100% de votre potentiel!",
        face_analysis_title: "Analyse Faciale",
        recommendations_title: "Recommandations Capillaires",
        recommendations_intro: "Si nous devions faire quelques suggestions:",
        styling_title: "Appliquez Votre Nouveau Plan Capillaire",
        products_title: "Détails"
      },
      'de': {
        header_title: "Verbessern Sie Ihre Haarpflege",
        hair_density_label: "Haardichte",
        hair_type_label: "Haartyp",
        face_shape_label: "Gesichtsform",
        chart_message: "Mit nur wenigen Tipps",
        chart_sub_message: "Erreichen Sie 100% Ihres Potenzials!",
        face_analysis_title: "Gesichtsanalyse",
        recommendations_title: "Haarempfehlungen",
        recommendations_intro: "Wenn wir nur ein paar Vorschläge machen sollten:",
        styling_title: "Wenden Sie Ihren neuen Haarplan an",
        products_title: "Details"
      }
    };
    
    // Get language code and translations
    const langCode = locale.split('-')[0].toLowerCase();
    const trans = translations[langCode] || translations['en'];
    
    // Generate random values for hair analysis
    const hairDensity = this.getHairDensity(langCode);
    const hairType = this.getHairType(langCode);
    const potentialPercent = Math.floor(Math.random() * (95 - 70) + 70); // Random between 70-95
    const quickTip = this.getQuickTip(faceShape, langCode);
    
    return {
      image_url: imageUrl,
      header_title: trans.header_title,
      quick_tip: quickTip,
      hair_properties: {
        density: {
          label: trans.hair_density_label,
          value: hairDensity
        },
        type: {
          label: trans.hair_type_label,
          value: hairType
        },
        face_shape: {
          label: trans.face_shape_label,
          value: faceShape
        }
      },
      chart_card: {
        percent: potentialPercent,
        message: trans.chart_message,
        sub_message: trans.chart_sub_message
      },
      face_analysis: {
        title: trans.face_analysis_title,
        sections: [
          {
            icon: "💡",
            title: trans.recommendations_title,
            intro: trans.recommendations_intro,
            content: recommendations
          },
          {
            icon: "❤️",
            title: trans.styling_title,
            content: stylingTips
          },
          {
            icon: "⭐",
            title: trans.products_title,
            content: products
          }
        ]
      }
    };
  }

  getHairDensity(langCode = 'tr') {
    const densityMap = {
      'tr': ["Seyrek", "Normal", "Yoğun", "Çok Yoğun"],
      'en': ["Sparse", "Normal", "Dense", "Very Dense"],
      'es': ["Escaso", "Normal", "Denso", "Muy Denso"],
      'fr': ["Clairsemé", "Normal", "Dense", "Très Dense"],
      'de': ["Dünn", "Normal", "Dicht", "Sehr Dicht"]
    };
    const densities = densityMap[langCode] || densityMap['en'];
    return densities[Math.floor(Math.random() * densities.length)];
  }

  getHairType(langCode = 'tr') {
    const typeMap = {
      'tr': ["Düz", "Dalgalı", "Kıvırcık", "Çok Kıvırcık"],
      'en': ["Straight", "Wavy", "Curly", "Very Curly"],
      'es': ["Liso", "Ondulado", "Rizado", "Muy Rizado"],
      'fr': ["Raide", "Ondulé", "Bouclé", "Très Bouclé"],
      'de': ["Glatt", "Wellig", "Lockig", "Sehr Lockig"]
    };
    const types = typeMap[langCode] || typeMap['en'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getQuickTip(faceShape, langCode = 'tr') {
    const tipTranslations = {
      'tr': {
        'Oval': 'Oval yüz şekliniz hemen hemen her saç stiline uyum sağlar, cesur seçimler yapabilirsiniz!',
        'Yuvarlak': 'Yüzünüze uzunluk katacak katmanlı kesimler ve yan ayrımlar sizin için ideal olacaktır.',
        'Kare': 'Yumuşak dalgalar ve katmanlı kesimler yüz hatlarınızı dengeleyecektir.',
        'Kalp': 'Çene hizasında hacimli modeller yüz şeklinizi mükemmel tamamlayacaktır.',
        'Üçgen': 'Üst kısımda hacimli, altta daralan kesimler yüzünüze denge katacaktır.',
        'Dikdörtgen': 'Yanak hizasında katmanlar ve dalgalar yüz hatlarınızı yumuşatacaktır.',
        'Elmas': 'Elmacık kemiklerinizi vurgulayacak orta uzunlukta kesimler harika görünecektir.',
        'default': 'Yüz şeklinize uygun saç modelini seçerek doğal güzelliğinizi ortaya çıkarabilirsiniz.'
      },
      'en': {
        'Oval': 'Your oval face shape suits almost any hairstyle, so feel free to make bold choices!',
        'Round': 'Layered cuts and side parts that add length to your face will be ideal for you.',
        'Square': 'Soft waves and layered cuts will balance your facial features.',
        'Heart': 'Voluminous styles at the jawline will perfectly complement your face shape.',
        'Triangle': 'Cuts with volume at the top and tapering at the bottom will add balance to your face.',
        'Rectangle': 'Layers and waves at cheek level will soften your facial contours.',
        'Diamond': 'Medium-length cuts that highlight your cheekbones will look amazing.',
        'default': 'Choosing a hairstyle that suits your face shape will enhance your natural beauty.'
      },
      'es': {
        'Oval': '¡Tu cara ovalada se adapta a casi cualquier peinado, así que puedes hacer elecciones atrevidas!',
        'Redonda': 'Los cortes en capas y las rayas laterales que añaden longitud a tu cara serán ideales para ti.',
        'Cuadrada': 'Las ondas suaves y los cortes en capas equilibrarán tus rasgos faciales.',
        'Corazón': 'Los estilos voluminosos a la altura de la mandíbula complementarán perfectamente tu forma de cara.',
        'Triángulo': 'Los cortes con volumen en la parte superior y que se estrechan en la parte inferior añadirán equilibrio a tu cara.',
        'Rectángulo': 'Las capas y ondas a la altura de las mejillas suavizarán tus contornos faciales.',
        'Diamante': 'Los cortes de longitud media que resaltan tus pómulos se verán increíbles.',
        'default': 'Elegir un peinado que se adapte a tu forma de cara realzará tu belleza natural.'
      },
      'fr': {
        'Ovale': 'Votre visage ovale convient à presque toutes les coiffures, alors n\'hésitez pas à faire des choix audacieux!',
        'Rond': 'Les coupes en couches et les raies sur le côté qui ajoutent de la longueur à votre visage seront idéales pour vous.',
        'Carré': 'Les vagues douces et les coupes en couches équilibreront vos traits du visage.',
        'Cœur': 'Les styles volumineux au niveau de la mâchoire compléteront parfaitement votre forme de visage.',
        'Triangle': 'Les coupes avec du volume en haut et effilées en bas ajouteront de l\'équilibre à votre visage.',
        'Rectangle': 'Les couches et les vagues au niveau des joues adouciront vos contours du visage.',
        'Diamant': 'Les coupes de longueur moyenne qui mettent en valeur vos pommettes seront magnifiques.',
        'default': 'Choisir une coiffure adaptée à votre forme de visage mettra en valeur votre beauté naturelle.'
      },
      'de': {
        'Oval': 'Ihre ovale Gesichtsform passt zu fast jeder Frisur, also trauen Sie sich ruhig mutige Entscheidungen!',
        'Rund': 'Stufenschnitte und Seitenscheitel, die Ihrem Gesicht Länge verleihen, sind ideal für Sie.',
        'Quadratisch': 'Sanfte Wellen und Stufenschnitte werden Ihre Gesichtszüge ausgleichen.',
        'Herz': 'Voluminöse Styles auf Kieferhöhe ergänzen Ihre Gesichtsform perfekt.',
        'Dreieck': 'Schnitte mit Volumen oben und nach unten verjüngt bringen Balance in Ihr Gesicht.',
        'Rechteck': 'Stufen und Wellen auf Wangenhöhe werden Ihre Gesichtskonturen weicher machen.',
        'Diamant': 'Mittellange Schnitte, die Ihre Wangenknochen betonen, werden großartig aussehen.',
        'default': 'Die Wahl einer Frisur, die zu Ihrer Gesichtsform passt, wird Ihre natürliche Schönheit hervorheben.'
      }
    };
    
    const tips = tipTranslations[langCode] || tipTranslations['en'];
    
    // Try to find the tip for the face shape in any language
    for (const [shape, tip] of Object.entries(tips)) {
      if (shape.toLowerCase() === faceShape.toLowerCase()) {
        return tip;
      }
    }
    
    return tips['default'] || tipTranslations['en']['default'];
  }
}

module.exports = GeminiService;