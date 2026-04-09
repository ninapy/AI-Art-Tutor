import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { storageService } from '../../services/api';
import type { UserStats } from '../../services/types';
import { COLORS, SKILL_LEVELS, PRESET_GOALS, type SkillLevelKey } from '../../constants/theme';
import { ProgressRing } from '../../components/ProgressRing';
import { GlassCard } from '../../components/GlassCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { useSkillLevel, useUserProgress } from '../../context/AppContext';

export default function HomeScreen() {
  const { skillLevel, setSkillLevel } = useSkillLevel();
  const { todayMinutes, dailyGoal, setDailyGoal, refreshTodayMinutes, addMinutes } = useUserProgress();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(dailyGoal);
  const [loaded, setLoaded] = useState(false);

  const loadStats = async () => {
    const loadedStats = await storageService.getStats();
    setStats(loadedStats);
    setLoaded(true);
  };

  useFocusEffect(
    useCallback(() => {
      refreshTodayMinutes();
      loadStats();
    }, [refreshTodayMinutes])
  );

  useEffect(() => {
    setSelectedGoal(dailyGoal);
  }, [dailyGoal]);

  const handleSetGoal = async () => {
    await setDailyGoal(selectedGoal);
    setShowGoalModal(false);
  };

  const handleSetSkillLevel = async (level: SkillLevelKey) => {
    await setSkillLevel(level);
    setShowSkillModal(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTimerComplete = async (durationMinutes: number) => {
    const sessionDuration = Math.max(durationMinutes, 1);
    await storageService.saveSession({
      id: `session-${Date.now()}`,
      mode: 'free',
      prompt: {
        id: `prompt-${Date.now()}`,
        type: 'text',
        content: 'Quick practice session',
      },
      completedAt: new Date(),
      durationMinutes: sessionDuration,
      skillLevel,
    });
    await storageService.recordSession(sessionDuration);
    await addMinutes(sessionDuration);
    await refreshTodayMinutes();
  };

  const dailyProgress = dailyGoal > 0 ? todayMinutes / dailyGoal : 0;

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.subtitle}>Ready to practice today?</Text>
        </View>

        <GlassCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Goal</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressContent}>
            <ProgressRing progress={dailyProgress} size={110} strokeWidth={10} color={COLORS.accent} backgroundColor={COLORS.border} showOverflow>
              <Text style={styles.progressPercent}>{Math.round(Math.min(dailyProgress, 1) * 100)}%</Text>
              <Text style={styles.progressSubtext}>{todayMinutes}/{dailyGoal}m</Text>
            </ProgressRing>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
              <Text style={styles.progressDescription}>
                {todayMinutes >= dailyGoal
                  ? 'Goal completed!'
                  : `${dailyGoal - todayMinutes}m to go`}
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
              <Text style={styles.statEmoji}>🏆</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statEmoji}>✏️</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.skillCard} onPress={() => setShowSkillModal(true)}>
          <View style={styles.skillHeader}>
            <View style={styles.skillInfo}>
              <Text style={styles.skillTitle}>Skill Level</Text>
              <Text style={styles.skillDescription}>
                {SKILL_LEVELS[skillLevel].label}
              </Text>
            </View>
            <View style={styles.skillArrow}>
              <Text style={styles.skillArrowText}>→</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.timerCard} onPress={() => setShowTimerModal(true)}>
          <View style={styles.timerHeader}>
            <View style={styles.timerInfo}>
              <Text style={styles.timerTitle}>Practice Timer</Text>
              <Text style={styles.timerDescription}>Track your session</Text>
            </View>
            <View style={styles.timerArrow}>
              <Text style={styles.timerArrowText}>→</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Pro Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipHeading}>Practice consistently</Text>
              <Text style={styles.tipText}>15 minutes daily beats 2 hours once a week</Text>
            </View>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>👀</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipHeading}>Study references</Text>
              <Text style={styles.tipText}>Image challenges help build observation skills</Text>
            </View>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipEmoji}>🔄</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipHeading}>Review your work</Text>
              <Text style={styles.tipText}>Get AI feedback to improve faster</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      <Modal visible={showGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many minutes do you want to practice?
            </Text>
            <View style={styles.goalGrid}>
              {PRESET_GOALS.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.goalOption,
                    selectedGoal === minutes && styles.goalOptionSelected,
                  ]}
                  onPress={() => setSelectedGoal(minutes)}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      selectedGoal === minutes && styles.goalOptionTextSelected,
                    ]}
                  >
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowGoalModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSetGoal}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      <Modal visible={showSkillModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Skill Level</Text>
            <Text style={styles.modalSubtitle}>
              Choose your current ability level
            </Text>
            {(Object.keys(SKILL_LEVELS) as SkillLevelKey[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.skillOption,
                  skillLevel === level && styles.skillOptionSelected,
                ]}
                onPress={() => handleSetSkillLevel(level)}
              >
                <View>
                  <Text style={[styles.skillOptionTitle, skillLevel === level && styles.skillOptionTitleSelected]}>
                    {SKILL_LEVELS[level].label}
                  </Text>
                  <Text style={styles.skillOptionDesc}>{SKILL_LEVELS[level].description}</Text>
                </View>
                {skillLevel === level && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSkillModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>

      <Modal visible={showTimerModal} transparent animationType="slide">
        <View style={styles.timerModalOverlay}>
          <View style={styles.timerModalContent}>
            <CountdownTimer
              initialMinutes={15}
              onComplete={async (duration) => {
                await handleTimerComplete(duration);
                setShowTimerModal(false);
                Alert.alert('Session Complete!', `${duration} minutes added to your daily goal.`);
              }}
            />
            <TouchableOpacity
              style={styles.timerDoneButton}
              onPress={() => setShowTimerModal(false)}
            >
              <Text style={styles.timerDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  progressDescription: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 4,
  },
  statEmoji: {
    fontSize: 24,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
  },
  skillCard: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
  },
  skillTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  skillDescription: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 4,
  },
  skillArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillArrowText: {
    fontSize: 18,
    color: COLORS.white,
  },
  timerCard: {
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerInfo: {
    flex: 1,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  timerDescription: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 4,
  },
  timerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerArrowText: {
    fontSize: 18,
    color: COLORS.white,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textCharcoal,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textCharcoal,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  goalOption: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  goalOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  goalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  goalOptionTextSelected: {
    color: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textGray,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  skillOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  skillOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  skillOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  skillOptionTitleSelected: {
    color: COLORS.white,
  },
  skillOptionDesc: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textCharcoal,
  },
  timerModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'flex-end',
  },
  timerModalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  timerDoneButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  timerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
