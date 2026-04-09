export const COLORS = {
  background: '#FA7000',
  cardBackground: '#FFFDD0',
  accent: '#FA7000',
  accentLight: '#FFB347',
  white: '#FFFFFF',
  textDark: '#2D2D2D',
  textCharcoal: '#2D2D2D',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  glassWhite: '#FFFDD0',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  darkOverlay: 'rgba(0, 0, 0, 0.5)',
};

export const SKILL_LEVELS = {
  beginner: {
    label: 'Beginner',
    description: 'Simple shapes, fruits, and basic objects',
    unsplashKeywords: ['ceramic mug still life', 'simple fruit bowl', 'basic geometric shapes', 'everyday objects photography'],
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Anatomy, still life, and complex compositions',
    unsplashKeywords: ['portrait photography face', 'urban street scene', 'detailed still life arrangement', 'figure gesture drawing'],
  },
  advanced: {
    label: 'Advanced',
    description: 'Landscapes, portraits, and expressive art',
    unsplashKeywords: ['complex architecture building', 'artistic portrait expression', 'landscape nature photography', 'figurative art composition'],
  },
} as const;

export type SkillLevelKey = keyof typeof SKILL_LEVELS;

export const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const PRESET_GOALS = [15, 30, 45, 60, 90, 120];

export const CHALLENGE_PROMPTS = {
  beginner: [
    'Draw a ceramic coffee mug',
    'Sketch a simple apple on a table',
    'Draw a pair of reading glasses',
    'Sketch a single flower in a vase',
    'Draw a kitchen spoon from observation',
    'Sketch a rounded stone or pebble',
    'Draw a simple tea cup',
    'Sketch a piece of fruit like an orange',
  ],
  intermediate: [
    'Draw hands holding an object',
    'Sketch a partial face profile',
    'Draw fabric draping over a chair',
    'Sketch a street scene with perspective',
    'Draw a detailed still life arrangement',
    'Sketch a figure in a relaxed pose',
  ],
  advanced: [
    'Draw an expressive self-portrait',
    'Sketch a building with complex perspective',
    'Create a dynamic action pose figure',
    'Draw an architectural interior',
    'Sketch emotion through gesture drawing',
    'Draw a landscape with depth and atmosphere',
  ],
};
