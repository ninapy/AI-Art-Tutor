import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrawingPrompt, AIFeedback, PracticeSession, UserStats, UserGoal, ChallengeReference } from './types';
import { CHALLENGE_PROMPTS, type SkillLevelKey } from '../constants/theme';

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const KEYS = {
  STATS: '@arttutor/stats',
  GOAL: '@arttutor/goal',
  HISTORY: '@arttutor/history',
  SKILL_LEVEL: '@arttutor/skill_level',
  TIMER_MINUTES: '@arttutor/timer_minutes',
};

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const promptService = {
  getRandomPrompt: async (type?: 'text' | 'image'): Promise<DrawingPrompt> => {
    await simulateDelay(300);
    const promptType = type || (Math.random() > 0.5 ? 'text' : 'image');
    
    if (promptType === 'text') {
      const prompts = [
        'Draw a cozy coffee shop scene',
        'Sketch a mountain landscape at sunset',
        'Draw your favorite childhood pet',
        'Create a still life with fruits',
        'Sketch a portrait of a stranger',
        'Draw an imaginary creature',
        'Practice drawing hands in various poses',
        'Draw a cityscape at night',
        'Sketch botanical elements',
        'Draw a self-portrait',
      ];
      const randomIndex = Math.floor(Math.random() * prompts.length);
      return {
        id: `text-${Date.now()}`,
        type: 'text',
        content: prompts[randomIndex],
        description: 'Use this prompt to inspire your drawing session',
      };
    } else {
      const topics = ['nature', 'portrait', 'architecture', 'animals', 'food', 'travel'];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      return {
        id: `img-${Date.now()}`,
        type: 'image',
        content: `https://source.unsplash.com/800x600/?${topic},art`,
        description: `Use this ${topic} image as a reference for your drawing`,
      };
    }
  },

  getChallengeForLevel: async (skillLevel: SkillLevelKey): Promise<ChallengeReference> => {
    await simulateDelay(500);
    const levelPrompts = CHALLENGE_PROMPTS[skillLevel];
    const randomIndex = Math.floor(Math.random() * levelPrompts.length);
    const prompt = levelPrompts[randomIndex];
    
    const LITERAL_KEYWORDS: Record<SkillLevelKey, string[]> = {
      beginner: ['minimalist fruit', 'basic geometric shapes', 'ceramic cup', 'simple still life photography'],
      intermediate: ['human hand study', 'vintage object', 'street lamp', 'detailed object photography'],
      advanced: ['architectural detail', 'portrait lighting', 'draped fabric', 'complex texture photography'],
    };
    
    const keywords = LITERAL_KEYWORDS[skillLevel];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const antiAbstractQuery = encodeURIComponent(`${keyword} -abstract -painting -watercolor`);
    
    let imageUrl: string;
    
    if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'your_unsplash_access_key_here') {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${antiAbstractQuery}&orientation=squarish&content_filter=high&per_page=10`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const randomPhoto = data.results[Math.floor(Math.random() * data.results.length)];
            imageUrl = randomPhoto.urls.regular;
          } else {
            imageUrl = `https://source.unsplash.com/600x600/?${keyword}`;
          }
        } else {
          imageUrl = `https://source.unsplash.com/600x600/?${keyword}`;
        }
      } catch {
        imageUrl = `https://source.unsplash.com/600x600/?${keyword}`;
      }
    } else {
      imageUrl = `https://source.unsplash.com/600x600/?${keyword}`;
    }
    
    return {
      imageUrl,
      prompt,
      topic: keyword,
    };
  },
};

interface CritiqueArea {
  area: string;
  critique: string;
  nextChallenge: string;
}

const CRITIQUE_AREAS: Record<SkillLevelKey, CritiqueArea[]> = {
  beginner: [
    {
      area: 'Basic Shapes & Proportions',
      critique: 'The overall shape relationships look good, but the head-to-body proportion could be slightly smaller for a more balanced figure study.',
      nextChallenge: 'Try drawing a self-portrait focusing on keeping the nose as 1/3 of the face height.',
    },
    {
      area: 'Line Quality',
      critique: 'Your line work shows confidence! The contour lines could benefit from more variation in weight - thicker at corners, thinner along curves.',
      nextChallenge: 'Practice continuous line drawings without lifting your pen from the paper.',
    },
    {
      area: 'Shape Simplification',
      critique: 'Great attempt at breaking down the subject! Try seeing complex forms as 3-4 basic geometric shapes before adding details.',
      nextChallenge: 'Draw everyday objects by first sketching circles, rectangles, and triangles that enclose them.',
    },
    {
      area: 'Light & Shadow',
      critique: 'You\'ve captured the light direction well. The shadow areas could be pushed darker to create stronger contrast.',
      nextChallenge: 'Draw a sphere with a single light source, focusing on the core shadow and reflected light.',
    },
  ],
  intermediate: [
    {
      area: 'Value Range',
      critique: 'Your value work is solid. Push the extremes - make your darkest darks darker and your lightest lights lighter to create more drama.',
      nextChallenge: 'Create a value scale of 5 steps, then apply it to a simple still life composition.',
    },
    {
      area: 'Negative Space',
      critique: 'The positive shapes read well, but the negative spaces around and between objects feel disconnected. Pay attention to the "gaps".',
      nextChallenge: 'Do a negative space thumbnail study of a chair or potted plant.',
    },
    {
      area: 'Edge Control',
      critique: 'Some edges are hard and some are soft - good variety! The transition between them could be more gradual in places.',
      nextChallenge: 'Practice the "lost and found edge" technique on a draped fabric study.',
    },
    {
      area: 'Perspective & Foreshortening',
      critique: 'The two-point perspective holds up, but the foreshortening on the closer elements feels compressed. Stand back and squint.',
      nextChallenge: 'Draw a box in extreme foreshortening - either from above looking down or below looking up.',
    },
  ],
  advanced: [
    {
      area: 'Anatomical Accuracy',
      critique: 'The shoulder structure reads correctly. The sternocleidomastoid muscle attachment points are slightly off - the sternal division starts lower than depicted.',
      nextChallenge: 'Do a 20-minute anatomical study of the neck and clavicle region.',
    },
    {
      area: 'Atmospheric Perspective',
      critique: 'Your foreground has excellent detail, but the background elements lack sufficient desaturation and value shift to create true depth.',
      nextChallenge: 'Paint a landscape with three planes: foreground (full color, dark), middle ground (reduced saturation), background (monochromatic light).',
    },
    {
      area: 'Lost and Found Edges',
      critique: 'Strong control of hard edges. The lost edges in the shadow side feel abrupt rather than gradual - consider the temperature shift as edges dissolve.',
      nextChallenge: 'Create a portrait study where 30% of the edges are intentionally lost.',
    },
    {
      area: 'Chiaroscuro',
      critique: 'The light logic is consistent. The reflected light in the shadow areas could benefit from warmer, cooler temperature shifts to add complexity.',
      nextChallenge: 'Do a 3-hour chiaroscuro study with a specific color temperature story.',
    },
  ],
};

async function imageToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const SKILL_PROMPTS: Record<SkillLevelKey, { voice: string; focus: string; terminology: string; examples: string }> = {
  beginner: {
    voice: 'encouraging and supportive. Use simple language. Celebrate small wins. Focus on building confidence.',
    focus: 'big shapes, basic proportions, light source identification, line confidence, shape simplification.',
    terminology: 'shapes, lines, light, shadow, outline, form, simple, basic, big, rough.',
    examples: 'Proportions: "The head is about 1/8 of the total height." Shapes: "Try to see the body as a collection of simple shapes like circles and rectangles."',
  },
  intermediate: {
    voice: 'constructive and educational. Provide specific technical guidance. Introduce intermediate concepts.',
    focus: 'values, negative space, contour, perspective, accuracy, edge control, form development.',
    terminology: 'values, tones, negative space, contour, perspective, foreshortening, edge, contrast, proportion, sighting.',
    examples: 'Values: "Push your darks darker and lights lighter for more drama." Negative Space: "Look at the space AROUND the object, not just the object itself."',
  },
  advanced: {
    voice: 'professional and critical. Use anatomical and artistic terminology. Challenge assumptions. Expect precision.',
    focus: 'anatomical accuracy, atmospheric perspective, lost and found edges, chiaroscuro, temperature shifts, core shadows.',
    terminology: 'anatomical landmarks, chiaroscuro, lost edges, found edges, atmospheric perspective, reflected light, core shadow, halation, gradation, gesture, sighting.',
    examples: 'Anatomy: "The sternocleidomastoid attachment points are slightly off." Edges: "The transition between the core shadow and reflected light needs a warmer temperature shift." Perspective: "Your one-point perspective plane is tilting slightly left."',
  },
};

function generateArtMentorText(
  skillLevel: SkillLevelKey,
  challengeType: 'prompt' | 'image',
  userIntent?: string
): string {
  const skill = SKILL_PROMPTS[skillLevel];
  const modeContext = challengeType === 'image' 
    ? 'CHALLENGE MODE (Image Reference): Compare the user\'s drawing against the reference image. Analyze proportional accuracy, value structure, edge treatment, and overall gestural capture.'
    : 'FREE DRAW MODE: Evaluate the drawing based on the user\'s stated intent and general technical quality.';

  return `You are a MASTER TECHNICAL ART MENTOR with decades of experience in life drawing, figure study, and observational art. You have taught at prestigious ateliers and mentored hundreds of students from absolute beginners to professional illustrators.

## YOUR VOICE & APPROACH
${skill.voice}
${skill.focus}

## CRITIQUE TERMINOLOGY FOR THIS STUDENT
Use these terms naturally in your feedback: ${skill.terminology}

${skill.examples}

## CHALLENGE CONTEXT
${modeContext}
${userIntent ? `The student stated their intent: "${userIntent}"` : ''}

## ANALYSIS FRAMEWORK
When analyzing, consider:
1. OVERALL IMPRESSION: What works immediately?
2. AREAS OF STRENGTH: What technical skills are evident?
3. CRITIQUE FOCUS (choose ONE primary area): Based on the skill level, identify the most important area for growth
4. SPECIFIC OBSERVATION: Make a concrete, actionable comment about a specific area of the drawing
5. NEXT CHALLENGE: Suggest ONE targeted exercise that addresses the critique

## RESPONSE FORMAT
Return your analysis in this exact JSON format:
{
  "shoutout": "An encouraging, specific celebration of something in the work (1-2 sentences)",
  "critiqueArea": "The specific technical area you focused on (e.g., 'Value Structure', 'Proportional Accuracy', 'Edge Control')",
  "specificCritique": "A precise, actionable observation about a specific part of the drawing (mention anatomical landmarks or compositional areas when relevant)",
  "actionItems": ["A specific tip that addresses the critique", "A general practice suggestion", "One technical exercise or technique to try"],
  "nextChallenge": "A specific, targeted exercise that would help the student improve in the critique area (e.g., 'Draw a hand in 5 different lighting scenarios' or 'Practice continuous line gesture drawings for 20 minutes')"
}

## CRITICAL RULES
- NEVER be vague. Every critique must mention a SPECIFIC area or technique.
- NEVER overwhelm with multiple critiques. Focus on ONE thing the student can improve.
- NEVER use advanced terminology for beginners or beginner language for advanced students.
- ALWAYS end with an actionable next challenge that ties directly to your critique.
- Your shoutout should be genuine, specific, and make the student feel seen.

Analyze the provided images and return your feedback in JSON format.`;
}

export const aiFeedbackService = {
  analyzeDrawing: async (
    imageUri: string,
    userIntent?: string,
    referenceImageUrl?: string,
    skillLevel?: SkillLevelKey,
    challengeType: 'prompt' | 'image' = 'prompt'
  ): Promise<AIFeedback> => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('No Groq API key found, using simulated feedback');
      return generateSimulatedFeedback(skillLevel, challengeType, userIntent);
    }

    try {
      console.log('Starting Groq API request...');
      
      const userImageBase64 = await imageToBase64(imageUri);
      const userImageDataUrl = `data:image/jpeg;base64,${userImageBase64}`;
      const promptText = generateArtMentorText(skillLevel || 'beginner', challengeType, userIntent);

      let content: { type: 'text'; text: string }[] | { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }[] = [];

      if (challengeType === 'image' && referenceImageUrl) {
        const refImageBase64 = await imageToBase64(referenceImageUrl);
        const refImageDataUrl = `data:image/jpeg;base64,${refImageBase64}`;
        content = [
          { type: 'text', text: `${promptText}\n\nFirst, analyze this reference image:` },
          { type: 'image_url', image_url: { url: refImageDataUrl } },
          { type: 'text', text: '\n\nNow analyze this student drawing:' },
          { type: 'image_url', image_url: { url: userImageDataUrl } }
        ];
      } else {
        content = [
          { type: 'text', text: `${promptText}\n\nAnalyze this drawing:` },
          { type: 'image_url', image_url: { url: userImageDataUrl } }
        ];
      }

      const payload = {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      };

      console.log('Sending request to Groq API...');

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Groq API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Groq API response received');

      const text = result.choices?.[0]?.message?.content;
      console.log('Response text:', text?.substring(0, 200) + '...');

      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('Parsed feedback:', parsed);
          return {
            shoutout: parsed.shoutout || 'Great work on this piece!',
            critiqueArea: parsed.critiqueArea || 'General Improvement',
            specificCritique: parsed.specificCritique || parsed.actionItems?.[0] || 'Keep practicing and experimenting with different techniques.',
            actionItems: parsed.actionItems || ['Continue practicing regularly', 'Study your references carefully', 'Focus on one technique at a time'],
            nextChallenge: parsed.nextChallenge || 'Practice for 15 minutes on your chosen technique.',
          };
        }
      }

      console.log('No valid JSON found in response, using simulated feedback');
      return generateSimulatedFeedback(skillLevel, challengeType, userIntent);
    } catch (error) {
      console.error('Groq API error, falling back to simulated:', error);
      return generateSimulatedFeedback(skillLevel, challengeType, userIntent);
    }
  },
};

function generateSimulatedFeedback(
  skillLevel?: SkillLevelKey,
  challengeType?: 'prompt' | 'image',
  userIntent?: string
): AIFeedback {
  const level = skillLevel || 'beginner';
  
  const levelShoutouts: Record<SkillLevelKey, string[]> = {
    beginner: [
      'Great job getting the basic shapes down!',
      'Your lines are getting smoother!',
      'Nice work on capturing the overall form!',
      'You\'re showing good observation skills!',
      'Your confidence is growing - keep it up!',
      'The proportions are coming together nicely!',
    ],
    intermediate: [
      'Excellent value range and control!',
      'Your understanding of negative space is improving!',
      'Strong contour work and edge control!',
      'Good sense of form and dimension!',
      'Your shading technique is becoming more sophisticated!',
      'Nice attention to the overall composition!',
    ],
    advanced: [
      'Impressive handling of light and shadow!',
      'Your anatomical understanding shows in the work!',
      'Sophisticated use of atmospheric perspective!',
      'Excellent control of lost and found edges!',
      'Your composition has strong visual rhythm!',
      'Professional-level mark-making and intention!',
    ],
  };

  const skillBasedTips: Record<SkillLevelKey, string[]> = {
    beginner: [
      'Try breaking your subject into 3-4 big shapes before adding details',
      'Focus on getting smooth, continuous lines - no picking up your pen!',
      'Practice the ghost line technique: trace in the air before committing',
      'Look for the light source and shade the side away from it',
      'Draw from real objects when possible - photos can flatten things',
      'Remember: mistakes are just practice in progress!',
    ],
    intermediate: [
      'Work on your understanding of values - push the light and dark contrast',
      'Practice measuring angles and proportions with your pencil',
      'Pay attention to lost and found edges in your subject',
      'Try sighting techniques to check your proportions',
      'Experiment with cross-hatching for more dynamic shading',
      'Study negative space - it\'s just as important as the subject',
    ],
    advanced: [
      'Focus on the core shadow and reflected light relationships',
      'Pay attention to subtle shifts in temperature within your values',
      'Study the anatomical landmarks that define form',
      'Work on your understanding of atmospheric perspective in depth',
      'Consider the edge quality hierarchy in your composition',
      'Push for greater expressiveness in your mark-making',
    ],
  };

  let modeSpecificTips: string[] = [];
  if (challengeType === 'image') {
    modeSpecificTips = [
      'Compare your proportions against the reference - look for consistent angles',
      'Study how the reference handles perspective and foreshortening',
      'Analyze the value structure: where are the darkest and lightest areas?',
      'Notice the edge treatment: some edges are sharp, others are soft',
      'Check if you\'ve captured the essential gesture of the subject',
    ];
  } else if (userIntent) {
    modeSpecificTips = [
      'Evaluate how well your drawing matches your original vision',
      'Ask yourself: what is the ONE thing viewers should notice?',
      'Consider if the composition supports your intent',
      'Reflect on what you\'d do differently next time',
      'Think about the story your drawing tells',
    ];
  } else {
    modeSpecificTips = [
      'Trust your instincts and keep practicing regularly',
      'Set small, achievable goals for each session',
      'Review your older work to see your progress',
    ];
  }

  const critiqueIndex = Math.floor(Math.random() * CRITIQUE_AREAS[level].length);
  const selectedCritique = CRITIQUE_AREAS[level][critiqueIndex];

  const allTips = [
    ...skillBasedTips[level],
    ...modeSpecificTips,
  ];
  const shuffledTips = allTips.sort(() => Math.random() - 0.5);

  return {
    shoutout: levelShoutouts[level][Math.floor(Math.random() * levelShoutouts[level].length)],
    critiqueArea: selectedCritique.area,
    specificCritique: selectedCritique.critique,
    actionItems: shuffledTips.slice(0, 3),
    nextChallenge: selectedCritique.nextChallenge,
  };
}

export const storageService = {
  getStats: async (): Promise<UserStats> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.STATS);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalPracticeMinutes: 0,
      totalSessions: 0,
      lastPracticeDate: null,
    };
  },
  
  updateStreak: async (): Promise<UserStats> => {
    const stats = await storageService.getStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (stats.lastPracticeDate === today) {
      return stats;
    }
    
    if (stats.lastPracticeDate === yesterday) {
      stats.currentStreak += 1;
    } else if (stats.lastPracticeDate !== today) {
      stats.currentStreak = 1;
    }
    
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastPracticeDate = today;
    
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    return stats;
  },
  
  recordSession: async (durationMinutes: number): Promise<UserStats> => {
    const stats = await storageService.getStats();
    stats.totalPracticeMinutes += durationMinutes;
    stats.totalSessions += 1;
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    return storageService.updateStreak();
  },
  
  getGoal: async (): Promise<UserGoal> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.GOAL);
      if (data) return JSON.parse(data);
    } catch {}
    return { dailyMinutes: 15, enabled: true };
  },
  
  setGoal: async (goal: UserGoal): Promise<void> => {
    await AsyncStorage.setItem(KEYS.GOAL, JSON.stringify(goal));
  },
  
  getSkillLevel: async (): Promise<SkillLevelKey> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.SKILL_LEVEL);
      if (data) return data as SkillLevelKey;
    } catch {}
    return 'beginner';
  },
  
  setSkillLevel: async (level: SkillLevelKey): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SKILL_LEVEL, level);
  },

  getTimerMinutes: async (): Promise<number> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TIMER_MINUTES);
      if (data) return parseInt(data, 10);
    } catch {}
    return 10;
  },

  setTimerMinutes: async (minutes: number): Promise<void> => {
    await AsyncStorage.setItem(KEYS.TIMER_MINUTES, minutes.toString());
  },
  
  getHistory: async (): Promise<PracticeSession[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },
  
  saveSession: async (session: PracticeSession): Promise<void> => {
    const history = await storageService.getHistory();
    history.unshift(session);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 100)));
  },

  getTodayPracticeMinutes: async (): Promise<number> => {
    const history = await storageService.getHistory();
    const today = new Date().toDateString();
    return history
      .filter(session => new Date(session.completedAt).toDateString() === today)
      .reduce((sum, session) => sum + session.durationMinutes, 0);
  },
};
