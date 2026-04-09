import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { AIFeedback } from './types';
import { SKILL_LEVELS, type SkillLevelKey } from '../constants/theme';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function buildPrompt(
  userIntent: string | undefined,
  referenceImageUrl: string | undefined,
  skillLevel: SkillLevelKey,
  mode: 'free' | 'challenge'
): string {
  const levelInfo = SKILL_LEVELS[skillLevel];
  let prompt = `You are a professional art mentor. The student is at ${levelInfo.label} level (${levelInfo.description}).\n\n`;

  if (mode === 'challenge' && referenceImageUrl) {
    prompt += `The student is doing a Daily Challenge where they should compare their work to a reference image.`;
  } else if (mode === 'free' && userIntent) {
    prompt += `The student was drawing with this intent: "${userIntent}". Judge their success based on this intent.`;
  }

  prompt += `
  
Provide feedback in the following JSON format only (no other text):
{
  "shoutout": "A specific positive observation about their work",
  "actionItems": ["Tip 1", "Tip 2", "Tip 3"]
}

Guidelines:
- Shoutout: Be specific and genuine. Mention actual techniques or elements you notice.
- Action Items: Make them actionable, specific to the student's level, and relevant to their intent or the challenge.
- Keep responses encouraging and constructive.
`;

  return prompt;
}

export const geminiService = {
  analyzeDrawing: async (
    imageUri: string,
    userIntent?: string,
    referenceImageUrl?: string,
    skillLevel?: SkillLevelKey,
    mode: 'free' | 'challenge' = 'free'
  ): Promise<AIFeedback> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using fallback');
      return geminiService.fallbackFeedback(userIntent, skillLevel);
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        safetySettings,
      });

      const promptText = buildPrompt(userIntent, referenceImageUrl, skillLevel || 'beginner', mode);

      const imageResponse = await fetch(imageUri);
      const imageBlob = await imageResponse.blob();
      const base64Image = await blobToBase64(imageBlob);

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: imageBlob.type || 'image/jpeg',
        },
      };

      const textPart = {
        text: promptText,
      };

      const result = await model.generateContent([imagePart, textPart]);
      const response = result.response;
      const text = response.text();

      return geminiService.parseResponse(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      return geminiService.fallbackFeedback(userIntent, skillLevel);
    }
  },

  fallbackFeedback: (userIntent?: string, skillLevel?: SkillLevelKey): AIFeedback => {
    const level = skillLevel || 'beginner';
    const baseShoutouts = [
      'Excellent use of shading to create depth and dimension!',
      'Great attention to proportions and perspective!',
      'Strong composition with effective visual hierarchy!',
      'Nice work on capturing the essence of your subject!',
      'Creative use of line weight adds visual interest!',
    ];

    const levelTips: Record<SkillLevelKey, string[]> = {
      beginner: [
        'Practice basic shapes - circles, squares, triangles to build muscle memory',
        'Focus on getting smooth, continuous lines without lifting your pen',
        'Try the \"ghost line\" technique: trace in the air before committing',
        'Study simple light and shadow patterns on everyday objects',
      ],
      intermediate: [
        'Work on understanding anatomical proportions with gesture studies',
        'Practice measuring angles and distances with your pencil',
        'Focus on capturing gesture and movement in your marks',
        'Study value ranges for more dynamic and impactful shading',
      ],
      advanced: [
        'Push for more expressive and gestural mark-making',
        'Focus on capturing essence rather than photorealistic detail',
        'Work on compositional energy, flow, and visual rhythm',
        'Experiment with unconventional approaches and materials',
      ],
    };

    return {
      shoutout: baseShoutouts[Math.floor(Math.random() * baseShoutouts.length)],
      actionItems: levelTips[level].slice(0, 3),
    };
  },

  parseResponse: (text: string): AIFeedback => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.shoutout && Array.isArray(parsed.actionItems)) {
          return {
            shoutout: parsed.shoutout,
            actionItems: parsed.actionItems.slice(0, 3),
          };
        }
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
    }
    return geminiService.fallbackFeedback();
  },
};

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
