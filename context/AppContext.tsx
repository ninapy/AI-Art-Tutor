import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storageService } from '../services/api';
import type { SkillLevelKey } from '../constants/theme';
import type { PracticeSession } from '../services/types';

interface AppContextType {
  skillLevel: SkillLevelKey;
  setSkillLevel: (level: SkillLevelKey) => Promise<void>;
  refreshSkillLevel: () => Promise<void>;
  todayMinutes: number;
  addMinutes: (minutes: number) => Promise<void>;
  refreshTodayMinutes: () => Promise<void>;
  dailyGoal: number;
  setDailyGoal: (minutes: number) => Promise<void>;
  refreshDailyGoal: () => Promise<void>;
  history: PracticeSession[];
  addToHistory: (session: PracticeSession) => Promise<void>;
  refreshHistory: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [skillLevel, setSkillLevelState] = useState<SkillLevelKey>('beginner');
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState(30);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSkillLevel = useCallback(async () => {
    try {
      const level = await storageService.getSkillLevel();
      setSkillLevelState(level);
    } catch (error) {
      console.error('Failed to load skill level:', error);
    }
  }, []);

  const loadTodayMinutes = useCallback(async () => {
    try {
      const minutes = await storageService.getTodayPracticeMinutes();
      setTodayMinutes(minutes);
    } catch (error) {
      console.error('Failed to load today minutes:', error);
    }
  }, []);

  const loadDailyGoal = useCallback(async () => {
    try {
      const goal = await storageService.getGoal();
      setDailyGoalState(goal.dailyMinutes);
    } catch (error) {
      console.error('Failed to load daily goal:', error);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const sessions = await storageService.getHistory();
      setHistory(sessions);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadSkillLevel(), loadTodayMinutes(), loadDailyGoal(), loadHistory()]);
    setIsLoading(false);
  }, [loadSkillLevel, loadTodayMinutes, loadDailyGoal, loadHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setSkillLevel = useCallback(async (level: SkillLevelKey) => {
    setSkillLevelState(level);
    await storageService.setSkillLevel(level);
  }, []);

  const refreshSkillLevel = useCallback(async () => {
    await loadSkillLevel();
  }, [loadSkillLevel]);

  const addMinutes = useCallback(async (minutes: number) => {
    setTodayMinutes((prev) => prev + minutes);
  }, []);

  const refreshTodayMinutes = useCallback(async () => {
    await loadTodayMinutes();
  }, [loadTodayMinutes]);

  const setDailyGoal = useCallback(async (minutes: number) => {
    setDailyGoalState(minutes);
    await storageService.setGoal({ dailyMinutes: minutes, enabled: true });
  }, []);

  const refreshDailyGoal = useCallback(async () => {
    await loadDailyGoal();
  }, [loadDailyGoal]);

  const addToHistory = useCallback(async (session: PracticeSession) => {
    setHistory((prev) => [session, ...prev]);
  }, []);

  const refreshHistory = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  return (
    <AppContext.Provider
      value={{
        skillLevel,
        setSkillLevel,
        refreshSkillLevel,
        todayMinutes,
        addMinutes,
        refreshTodayMinutes,
        dailyGoal,
        setDailyGoal,
        refreshDailyGoal,
        history,
        addToHistory,
        refreshHistory,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useSkillLevel() {
  const { skillLevel, setSkillLevel, refreshSkillLevel, isLoading } = useAppContext();
  return { skillLevel, setSkillLevel, refreshSkillLevel, isLoading };
}

export function useUserProgress() {
  const { todayMinutes, addMinutes, refreshTodayMinutes, dailyGoal, setDailyGoal, refreshDailyGoal, history, addToHistory, refreshHistory } = useAppContext();
  return { todayMinutes, addMinutes, refreshTodayMinutes, dailyGoal, setDailyGoal, refreshDailyGoal, history, addToHistory, refreshHistory };
}
