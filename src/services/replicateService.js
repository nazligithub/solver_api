const Replicate = require('replicate');
const { ApiError } = require('../utils/response');
const supabase = require('../config/supabase');

class ReplicateService {
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });
  }

  async processColorChange(imageUrl, color, gender) {
    try {
      let prompt;
      let colorData = null;
      
      if (color.startsWith('#')) {
        // Custom hex color
        const hexColor = color.toUpperCase();
        const simpleName = this.getSimpleColorName(hexColor);
        prompt = `Change ONLY the hair color to ${simpleName}. Keep the exact same hairstyle, hair length, hair texture, and hair shape. Do NOT modify the haircut or styling.`;
        
        // Create a virtual colorData object for response
        colorData = {
          color_name: 'Custom',
          hex_code: hexColor,
          gender: gender,
          isCustom: true
        };
      } else if (color.toLowerCase() === 'custom') {
        throw new ApiError('For custom color, please provide a hex color code', 400);
      } else {
        // Predefined color
        colorData = await this.getColorFromDatabase(color, gender);
        prompt = `Change ONLY the hair color to ${colorData.color_name.toLowerCase()}. Keep the exact same hairstyle, hair length, hair texture, and hair shape. Do NOT modify the haircut or styling.`;
      }

      const input = {
        prompt: prompt,
        go_fast: true,
        guidance: 2.5,
        input_image: imageUrl,
        aspect_ratio: "match_input_image",
        output_format: "jpg",
        output_quality: 80,
        num_inference_steps: 30
      };

      const output = await this.replicate.run("black-forest-labs/flux-kontext-dev", { input });
      
      // Get the output URL
      let outputUrl = output;
      if (typeof output === 'object' && output.url) {
        outputUrl = output.url();
      } else if (Array.isArray(output) && output.length > 0) {
        outputUrl = output[0];
      }
      
      return { output: outputUrl, colorData };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Replicate error:', error);
      throw new ApiError('Failed to process color change', 500);
    }
  }

  async processStyleChange(imageUrl, styleId, gender) {
    try {
      const styleData = await this.getStyleFromDatabase(styleId, gender);
      
      const input = {
        prompt: `Change ONLY the hairstyle to ${styleData.style_name.toLowerCase()}. Keep the exact same hair color, face shape, and facial features. Do NOT modify the hair color or any facial features.`,
        go_fast: true,
        guidance: 2.5,
        input_image: imageUrl,
        aspect_ratio: "match_input_image",
        output_format: "jpg",
        output_quality: 80,
        num_inference_steps: 30
      };

      const output = await this.replicate.run("black-forest-labs/flux-kontext-dev", { input });
      
      // Get the output URL
      let outputUrl = output;
      if (typeof output === 'object' && output.url) {
        outputUrl = output.url();
      } else if (Array.isArray(output) && output.length > 0) {
        outputUrl = output[0];
      }
      
      return { output: outputUrl, styleData };
    } catch (error) {
      console.error('Replicate error:', error);
      throw new ApiError('Failed to process style change', 500);
    }
  }

  async getColorFromDatabase(colorName, gender) {
    const query = supabase
      .from('hair_colors')
      .select('*')
      .ilike('color_name', colorName);

    if (gender) {
      query.eq('gender', gender);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new ApiError('Color not found', 404);
    }

    return data;
  }

  async getStyleFromDatabase(styleId, gender) {
    const query = supabase
      .from('hair_styles')
      .select('*');

    if (styleId) {
      query.eq('id', styleId);
    } else if (gender) {
      query.eq('gender', gender);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new ApiError('Style not found', 404);
    }

    return data;
  }

  getSimpleColorName(hex) {
    // Direct color mappings with natural hair colors
    const colors = {
      // Blacks
      '#1B1B1B': 'jet black',
      '#2C2416': 'natural black',
      
      // Browns
      '#3B2F2F': 'dark chocolate',
      '#4E3B31': 'espresso brown',
      '#7B3F00': 'chocolate brown',
      '#8B4513': 'chestnut brown',
      '#C68642': 'caramel brown',
      '#DDA15E': 'caramel highlights',
      
      // Blondes
      '#F0E68C': 'honey blonde',
      '#FFD700': 'golden blonde',
      '#FAFAD2': 'platinum blonde',
      '#E5E4E2': 'platinum blonde',
      '#F4A460': 'strawberry blonde',
      '#A8A19E': 'ash blonde',
      
      // Reds
      '#B87333': 'copper red',
      '#A52A2A': 'auburn',
      '#800020': 'burgundy',
      '#C04000': 'mahogany',
      '#E0BFB8': 'rose gold',
      
      // Grays/Silvers
      '#B2BEB5': 'ash gray',
      '#C0C0C0': 'silver',
      '#F5F5F5': 'pearl silver'
    };

    // Return exact match if available
    if (colors[hex.toUpperCase()]) {
      return colors[hex.toUpperCase()];
    }

    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Calculate HSL values to better determine color
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    const delta = max - min;
    
    let h = 0;
    let s = 0;
    
    if (delta !== 0) {
      s = delta / (255 - Math.abs(2 * l * 255 - 255));
      
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6 * 360;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6 * 360;
      } else {
        h = ((r - g) / delta + 4) / 6 * 360;
      }
    }

    // Determine color name based on HSL and RGB values
    // Very dark colors (black shades)
    if (l < 0.2) {
      return 'jet black';
    }
    
    // Very light colors (platinum/white)
    if (l > 0.85) {
      if (s < 0.1) {
        return 'platinum blonde';
      } else if (h >= 30 && h <= 60) {
        return 'light blonde';
      } else if (h >= 0 && h <= 30) {
        return 'strawberry blonde';
      }
    }
    
    // Gray shades (low saturation)
    if (s < 0.1) {
      if (l < 0.4) {
        return 'charcoal gray';
      } else if (l < 0.6) {
        return 'ash gray';
      } else {
        return 'silver';
      }
    }

    // Vibrant colors based on hue
    if (h >= 0 && h < 20) {
      // Red range
      if (s > 0.5) {
        return 'vibrant red';
      } else if (l < 0.5) {
        return 'burgundy';
      } else {
        return 'copper red';
      }
    } else if (h >= 20 && h < 45) {
      // Orange range
      if (l < 0.5) {
        return 'auburn';
      } else {
        return 'copper orange';
      }
    } else if (h >= 45 && h < 65) {
      // Yellow range
      if (l < 0.5) {
        return 'honey blonde';
      } else {
        return 'golden blonde';
      }
    } else if (h >= 65 && h < 150) {
      // Green range
      if (l < 0.4) {
        return 'deep forest green';
      } else if (l < 0.6) {
        return 'emerald green';
      } else {
        return 'bright lime green';
      }
    } else if (h >= 150 && h < 250) {
      // Blue range
      if (h >= 150 && h < 180) {
        return 'turquoise blue';
      } else if (l < 0.4) {
        return 'deep navy blue';
      } else if (l < 0.6) {
        return 'ocean blue';
      } else {
        return 'sky blue';
      }
    } else if (h >= 250 && h < 290) {
      // Purple range
      if (l < 0.5) {
        return 'deep purple';
      } else {
        return 'violet purple';
      }
    } else if (h >= 290 && h <= 360) {
      // Pink/Magenta range
      if (l < 0.5) {
        return 'burgundy';
      } else {
        return 'rose pink';
      }
    }

    // Browns (special handling based on RGB ratios)
    if (r > g && g > b && (r - b) < 100) {
      if (l < 0.3) {
        return 'dark chocolate brown';
      } else if (l < 0.5) {
        return 'chestnut brown';
      } else {
        return 'caramel brown';
      }
    }

    // Default fallback
    return 'custom vibrant color';
  }

  async saveProcessingHistory(data) {
    const { data: result, error } = await supabase
      .from('processing_history')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Failed to save processing history:', error);
    }

    return result;
  }
}

module.exports = ReplicateService;