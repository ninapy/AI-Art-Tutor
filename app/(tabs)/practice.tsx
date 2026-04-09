import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { promptService, aiFeedbackService, storageService } from '../../services/api';
import type { AIFeedback, ChallengeReference } from '../../services/types';
import { COLORS, SKILL_LEVELS, CHALLENGE_PROMPTS, type SkillLevelKey } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { SessionCompleteModal } from '../../components/SessionCompleteModal';
import { useSkillLevel, useUserProgress } from '../../context/AppContext';

type ActiveMode = 'prompt' | 'image' | null;

export default function PracticeScreen() {
  const { skillLevel, refreshSkillLevel } = useSkillLevel();
  const { addMinutes, refreshTodayMinutes } = useUserProgress();
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [freeIntent, setFreeIntent] = useState('');
  const [suggestedPrompt, setSuggestedPrompt] = useState<string>('');
  const [challenge, setChallenge] = useState<ChallengeReference | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedDuration] = useState(10);

  const getRandomPrompt = useCallback((level: SkillLevelKey) => {
    const prompts = CHALLENGE_PROMPTS[level];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, []);

  const handleRefreshPrompt = useCallback((level: SkillLevelKey) => {
    const newPrompt = getRandomPrompt(level);
    setSuggestedPrompt(newPrompt);
  }, [getRandomPrompt]);

  const fetchChallenge = useCallback(async (level: SkillLevelKey) => {
    setLoading(true);
    setFeedback(null);
    setSelectedImage(null);
    try {
      const challengeData = await promptService.getChallengeForLevel(level);
      setChallenge(challengeData);
    } catch {
      Alert.alert('Error', 'Failed to load challenge. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshSkillLevel();
  }, [refreshSkillLevel]);

  useEffect(() => {
    handleRefreshPrompt(skillLevel);
  }, [skillLevel, handleRefreshPrompt]);

  useEffect(() => {
    setSessionStartTime(new Date());
  }, []);

  const handleModeSelect = (mode: ActiveMode) => {
    setActiveMode(mode);
    setFeedback(null);
    setSelectedImage(null);
    if (mode === 'image') {
      fetchChallenge(skillLevel);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setFeedback(null);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setFeedback(null);
    }
  };

  const handleCompleteSession = async (durationMinutes: number) => {
    const sessionDuration = Math.max(durationMinutes, 1);
    await storageService.saveSession({
      id: `session-${Date.now()}`,
      mode: 'challenge',
      prompt: {
        id: `prompt-${Date.now()}`,
        type: activeMode === 'image' ? 'image' : 'text',
        content: activeMode === 'image' ? challenge?.prompt || '' : freeIntent || suggestedPrompt,
      },
      imageUri: selectedImage || undefined,
      referenceImageUri: activeMode === 'image' ? challenge?.imageUrl : undefined,
      userIntent: activeMode === 'prompt' ? freeIntent : undefined,
      feedback: feedback || undefined,
      completedAt: new Date(),
      durationMinutes: sessionDuration,
      skillLevel,
    });
    await storageService.recordSession(sessionDuration);
    await addMinutes(sessionDuration);
    await refreshTodayMinutes();
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !activeMode) return;

    setAnalyzing(true);
    try {
      const userIntent = activeMode === 'prompt' ? freeIntent || suggestedPrompt : undefined;
      const referenceImageUrl = activeMode === 'image' ? challenge?.imageUrl : undefined;
      
      const result = await aiFeedbackService.analyzeDrawing(
        selectedImage,
        userIntent,
        referenceImageUrl,
        skillLevel,
        activeMode
      );
      setFeedback(result);
      setShowSessionModal(true);
    } catch {
      Alert.alert('Error', 'Failed to analyze your drawing. Please try again.');
    }
    setAnalyzing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Practice</Text>
            <View style={[styles.levelBadge, { marginRight: 16 }]}>
              <Text style={styles.levelBadgeText}>
                {SKILL_LEVELS[skillLevel].label}
              </Text>
            </View>
          </View>

          <GlassCard style={styles.modeSelectorCard}>
            <Text style={styles.sectionLabel}>Choose Challenge Type</Text>
            
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, activeMode === 'prompt' && styles.modeButtonActive]}
                onPress={() => handleModeSelect('prompt')}
              >
                <Text style={styles.modeIcon}>✏️</Text>
                <Text style={[styles.modeTitle, activeMode === 'prompt' && styles.modeTitleActive]}>
                  Text Prompt
                </Text>
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <Text style={styles.orText}>OR</Text>
              </View>

              <TouchableOpacity
                style={[styles.modeButton, activeMode === 'image' && styles.modeButtonActive]}
                onPress={() => handleModeSelect('image')}
              >
                <Text style={styles.modeIcon}>🖼️</Text>
                <Text style={[styles.modeTitle, activeMode === 'image' && styles.modeTitleActive]}>
                  Image Reference
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {activeMode === 'prompt' && (
            <>
              <GlassCard style={styles.promptCard}>
                <Text style={styles.cardTitle}>What is your free idea today?</Text>
                <TextInput
                  style={styles.intentInput}
                  placeholder="Describe what you want to draw..."
                  placeholderTextColor={COLORS.textLight}
                  value={freeIntent}
                  onChangeText={setFreeIntent}
                  multiline
                  numberOfLines={3}
                />
              </GlassCard>

              <GlassCard style={styles.suggestedCard}>
                <View style={styles.suggestedHeader}>
                  <Text style={styles.cardTitle}>Or try this suggestion</Text>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={() => handleRefreshPrompt(skillLevel)}
                  >
                    <Text style={styles.refreshButtonText}>🔄 New</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.suggestedPrompt}>{suggestedPrompt}</Text>
              </GlassCard>
            </>
          )}

          {activeMode === 'image' && (
            <GlassCard style={styles.imageCard}>
              <View style={styles.imageHeader}>
                <Text style={styles.cardTitle}>Your Reference</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => fetchChallenge(skillLevel)}
                >
                  <Text style={styles.refreshButtonText}>🔄 New</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Loading reference...</Text>
                </View>
              ) : challenge ? (
                <Image
                  source={{ uri: challenge.imageUrl }}
                  style={styles.referenceImage}
                  resizeMode="contain"
                />
              ) : null}
            </GlassCard>
          )}

          <GlassCard style={styles.uploadCard}>
            <Text style={styles.cardTitle}>Upload Your Drawing</Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Camera Roll</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {selectedImage && activeMode && (
              <View style={styles.selectedImageContainer}>
                <View style={styles.selectedImageHeader}>
                  <Text style={styles.selectedImageLabel}>Your Drawing</Text>
                  <TouchableOpacity onPress={() => setShowTimer(true)}>
                    <Text style={styles.timerButton}>⏱️ Timer</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.analyzeButtonText}>🤖 Get AI Feedback</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {feedback && (
            <GlassCard style={styles.feedbackCard}>
              <View style={styles.shoutoutContainer}>
                <Text style={styles.shoutoutEmoji}>🌟</Text>
                <View style={styles.shoutoutContent}>
                  <Text style={styles.shoutoutTitle}>Shoutout</Text>
                  <Text style={styles.shoutoutText}>{feedback.shoutout}</Text>
                </View>
              </View>
              <Text style={styles.tipsTitle}>Next Steps</Text>
              {feedback.actionItems.map((item, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{item}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showTimer} transparent animationType="slide">
        <View style={styles.timerModalOverlay}>
          <View style={styles.timerModalContent}>
            <CountdownTimer
              initialMinutes={selectedDuration}
              onComplete={async () => {
                await handleCompleteSession(selectedDuration);
                setShowTimer(false);
                Alert.alert('Session Complete!', `${selectedDuration} minutes added to your daily goal.`);
              }}
              onCancel={() => setShowTimer(false)}
            />
            <TouchableOpacity
              style={styles.timerDoneButton}
              onPress={() => setShowTimer(false)}
            >
              <Text style={styles.timerDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedImage && (
        <SessionCompleteModal
          visible={showSessionModal}
          imageUri={selectedImage}
          suggestedMinutes={sessionStartTime ? Math.max(Math.round((Date.now() - sessionStartTime.getTime()) / 60000), 5) : 10}
          onComplete={async (minutes) => {
            await handleCompleteSession(minutes);
            setShowSessionModal(false);
            Alert.alert('Session Saved!', `${minutes} minutes added to your progress.`);
          }}
          onCancel={() => setShowSessionModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  modeSelectorCard: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  modeTitleActive: {
    color: COLORS.white,
  },
  orDivider: {
    paddingHorizontal: 16,
  },
  orText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGray,
  },
  promptCard: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textCharcoal,
    marginBottom: 12,
  },
  intentInput: {
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textCharcoal,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestedCard: {
    marginBottom: 16,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  suggestedPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textCharcoal,
    lineHeight: 26,
  },
  imageCard: {
    marginBottom: 16,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textCharcoal,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  referenceImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 12,
  },
  uploadCard: {
    marginBottom: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textCharcoal,
    fontWeight: '500',
  },
  selectedImageContainer: {
    marginTop: 16,
  },
  selectedImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  timerButton: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  selectedImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  feedbackCard: {
    marginBottom: 16,
  },
  shoutoutContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  shoutoutEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  shoutoutContent: {
    flex: 1,
  },
  shoutoutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  shoutoutText: {
    fontSize: 15,
    color: COLORS.textCharcoal,
    lineHeight: 22,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textCharcoal,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tipNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textCharcoal,
    lineHeight: 20,
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
