import type { SkillLevelKey } from '../constants/theme';

export interface DrawingPrompt {
  id: string;
  type: 'text' | 'image';
  content: string;
  description?: string;
}

export interface AIFeedback {
  shoutout: string;
  critiqueArea?: string;
  specificCritique?: string;
  actionItems: string[];
  nextChallenge?: string;
}

export interface PracticeSession {
  id: string;
  mode: 'free' | 'challenge';
  prompt: DrawingPrompt;
  imageUri?: string;
  referenceImageUri?: string;
  userIntent?: string;
  feedback?: AIFeedback;
  completedAt: Date;
  durationMinutes: number;
  skillLevel?: SkillLevelKey;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalPracticeMinutes: number;
  totalSessions: number;
  lastPracticeDate: string | null;
}

export interface UserGoal {
  dailyMinutes: number;
  enabled: boolean;
}

export interface UserPreferences {
  skillLevel: SkillLevelKey;
  dailyGoalMinutes: number;
  timerMinutes: number;
}

export interface ChallengeReference {
  imageUrl: string;
  prompt: string;
  topic: string;
}
