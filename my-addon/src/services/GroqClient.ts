import Groq from 'groq-sdk';

export interface BrandData {
  primaryColors: string[];
  brandVoice: string;
  designGuidelines: string[];
}

export interface VisionAnalysis {
  score: number;
  colorConsistency: number;
  typographyScale: number;
  spacingRhythm: number;
  accessibility: number;
  feedback: string[];
  recommendations: string[];
}

class GroqClient {
  private client: Groq;
  private readonly TEXT_MODEL = 'llama-3.3-70b-versatile';
  private readonly VISION_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

  constructor() {
    // @ts-ignore - Webpack DefinePlugin injects this
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY is not defined in environment variables');
    }

    this.client = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });
  }

  /**
   * Extract brand identity from website content
   */
  async extractBrandIdentity(websiteContent: string): Promise<BrandData> {
    try {
      const prompt = `Extract brand identity from website content. Return ONLY valid JSON, no markdown, no explanations.

CONTENT:
${websiteContent.substring(0, 3000)}

RULES (STRICT):
1. primaryColors: EXACTLY 3-5 hex codes (format: #RRGGBB uppercase). Extract from visible brand elements (logo, headers, buttons). No gradients, no approximations.
2. brandVoice: EXACTLY 2-3 sentences. Format: "[Target audience]. [Core values/personality]. [Unique differentiator]." Be specific, not generic.
3. designGuidelines: EXACTLY 4 items. Must be observable design patterns (spacing system, typography style, layout approach, visual hierarchy).

REQUIRED FORMAT (copy exactly):
{
  "primaryColors": ["#HEXCOD", "#HEXCOD", "#HEXCOD"],
  "brandVoice": "Sentence 1. Sentence 2. Sentence 3.",
  "designGuidelines": ["Observable pattern 1", "Observable pattern 2", "Observable pattern 3", "Observable pattern 4"]
}

Extract factually from content. No assumptions. If unclear, use conservative defaults.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a JSON extraction bot. Return only valid JSON. No markdown. No explanations.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.TEXT_MODEL,
        temperature: 0.0,
        max_tokens: 512,
        response_format: { type: 'json_object' } as any,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const brandData = JSON.parse(cleanedResponse) as BrandData;

      // Strict validation with normalization
      if (!brandData.primaryColors || !Array.isArray(brandData.primaryColors) || brandData.primaryColors.length < 3) {
        brandData.primaryColors = ['#1A73E8', '#34A853', '#FBBC04'];
      }
      
      // Normalize hex codes to uppercase
      brandData.primaryColors = brandData.primaryColors
        .slice(0, 5)
        .map(c => c.toUpperCase().match(/#[0-9A-F]{6}/) ? c.toUpperCase() : '#1A73E8');
      
      if (!brandData.brandVoice || brandData.brandVoice.length < 50) {
        brandData.brandVoice = 'Modern professional brand. Focused on innovation and user-centric design. Appeals to tech-savvy audiences.';
      }
      
      if (!brandData.designGuidelines || !Array.isArray(brandData.designGuidelines) || brandData.designGuidelines.length < 4) {
        brandData.designGuidelines = ['Consistent spacing system', 'Clear color hierarchy', 'Accessible typography', 'Minimalist aesthetics'];
      }
      
      // Ensure exactly 4 guidelines
      brandData.designGuidelines = brandData.designGuidelines.slice(0, 4);

      return brandData;
    } catch (error) {
      console.error('Error extracting brand identity:', error);
      // Return strict fallback data
      return {
        primaryColors: ['#1A73E8', '#34A853', '#FBBC04'],
        brandVoice: 'Modern professional brand. Focused on innovation and user-centric design. Appeals to tech-savvy audiences.',
        designGuidelines: [
          'Consistent spacing system',
          'Clear color hierarchy',
          'Accessible typography',
          'Minimalist aesthetics',
        ],
      };
    }
  }

  /**
   * Generate Firefly prompt based on brand context and trend
   */
  async generateFireflyPrompt(
    trend: string,
    brandContext: BrandData,
    includeTrendySuggestions: boolean = false,
    selectedEvents: string[] = []
  ): Promise<string> {
    try {
      const prompt = `Create a concise Adobe Firefly prompt (max 100 words) for: ${trend}

Brand: ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0]}

Include: style, composition, lighting, mood, brand colors. Be specific and direct.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.TEXT_MODEL,
        temperature: 0.2,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || `${trend} design with ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0].toLowerCase()}`;
    } catch (error) {
      console.error('Error generating Firefly prompt:', error);
      return `${trend} design with ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0].toLowerCase()}`;
    }
  }

  /**
   * Get AI-generated viral trends and festivals tailored to brand identity
   */
  async getViralTrends(brandData?: BrandData): Promise<Array<{ id: string; name: string; desc: string }>> {
    try {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const brandContext = brandData ? `

Brand Context to Consider:
- Brand Voice: ${brandData.brandVoice}
- Primary Colors: ${brandData.primaryColors.join(', ')}
- Design Guidelines: ${brandData.designGuidelines.join('; ')}

Tailor trend suggestions that align with this brand's identity, voice, and aesthetic preferences.` : '';

      const prompt = `You are a design trend expert. Based on today's date (${currentDate}), suggest 8-12 trending design styles, viral content themes, and relevant upcoming festivals/events.${brandContext}

Consider:
- Current social media trends (TikTok, Instagram, etc.)
- Upcoming festivals and holidays in the next 2 months
- Viral visual aesthetics
- Popular design movements
- Seasonal themes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "kebab-case-id",
    "name": "Trend Name",
    "desc": "Brief description (under 60 chars)"
  }
]

Include a mix of:
- Design aesthetics (minimalist, maximalist, glassmorphism, etc.)
- Viral content styles (before/after, POV, tutorial, etc.)
- Relevant festivals/events (Valentine's, Lunar New Year, etc.)
- Current trending themes

Return ONLY the JSON array, no markdown formatting or additional text.`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.TEXT_MODEL,
        temperature: 0.3,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const trends = JSON.parse(cleanedResponse) as Array<{ id: string; name: string; desc: string }>;

      // Validate response
      if (!Array.isArray(trends) || trends.length === 0) {
        throw new Error('Invalid trends response');
      }

      return trends;
    } catch (error) {
      console.error('Error fetching viral trends:', error);
      // Return fallback trends
      return [
        { id: 'minimalist', name: 'Minimalist', desc: 'Clean, simple designs with white space' },
        { id: 'bold-typography', name: 'Bold Typography', desc: 'Large, impactful text' },
        { id: 'gradient', name: 'Gradient Fusion', desc: 'Modern color blends' },
        { id: 'valentines', name: "Valentine's Day", desc: 'Romantic themes for Feb 14' },
        { id: '3d-render', name: '3D Elements', desc: 'Depth with realistic renders' },
        { id: 'glassmorphism', name: 'Glassmorphism', desc: 'Frosted glass aesthetics' },
      ];
    }
  }

  /**
   * Analyze design against brand guidelines using vision model
   */
  async analyzeDesign(
    imageBase64: string,
    brandGuidelines: BrandData
  ): Promise<VisionAnalysis> {
    try {
      const prompt = `You are a BRUTAL design critic with professional design standards. Analyze this design against brand guidelines with HARSH, UNFORGIVING criteria.

Brand Guidelines (MUST match exactly):
- Primary Colors: ${brandGuidelines.primaryColors.join(', ')}
- Brand Voice: ${brandGuidelines.brandVoice}
- Design Guidelines: ${brandGuidelines.designGuidelines.join('; ')}

SCORING RULES (0-100, be HARSH):
- Empty/blank designs: 0-10
- White page or minimal content: 5-15
- Wrong colors used: -30 points
- Poor contrast (WCAG fail): -25 points
- No clear hierarchy: -20 points
- Inconsistent spacing: -15 points
- Non-brand colors: -30 points
- Cluttered/messy: -20 points
- Amateur typography: -15 points
- Score 80+: ONLY for near-perfect, professional designs
- Score 90+: ONLY for exceptional, flawless work

Evaluate STRICTLY on:
1. **Color Consistency** (0-100): Do colors EXACTLY match brand palette? Any deviation = major penalty
2. **Typography Scale** (0-100): Is hierarchy crystal clear? Professional font sizes? Readability?
3. **Spacing Rhythm** (0-100): Is spacing mathematically consistent? Follows grid system?
4. **Accessibility** (0-100): WCAG AAA compliant? Perfect contrast ratios? Screen reader friendly?

Be BRUTALLY honest. Call out every flaw. No sugar-coating.

Return ONLY valid JSON:
{
  "score": overall_0_to_100,
  "colorConsistency": 0_to_100,
  "typographyScale": 0_to_100,
  "spacingRhythm": 0_to_100,
  "accessibility": 0_to_100,
  "feedback": ["harsh, specific criticism"],
  "recommendations": ["direct, actionable fixes"]
}`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        model: this.VISION_MODEL,
        temperature: 0.1,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      console.log('Vision API Response:', responseText); // Debug log
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('Cleaned Response:', cleanedResponse); // Debug log

      const analysis = JSON.parse(cleanedResponse) as VisionAnalysis;

      console.log('Parsed Analysis:', analysis); // Debug log

      // NO DEFAULT INFLATION - return actual scores or harsh defaults
      return {
        score: analysis.score ?? 15,
        colorConsistency: analysis.colorConsistency ?? 20,
        typographyScale: analysis.typographyScale ?? 25,
        spacingRhythm: analysis.spacingRhythm ?? 20,
        accessibility: analysis.accessibility ?? 30,
        feedback: analysis.feedback || ['Unable to analyze design - appears empty or invalid'],
        recommendations: analysis.recommendations || ['Start with basic design principles: clear hierarchy, brand colors, proper spacing'],
      };
    } catch (error) {
      console.error('Error analyzing design:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Throw error so UI can catch it
      throw new Error(
        error instanceof Error 
          ? `Design analysis failed: ${error.message}` 
          : 'Design analysis service unavailable'
      );
    }
  }
}

// Export a singleton instance
export const groqClient = new GroqClient();
