import { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import type { PracticeSession } from '../../services/types';
import { COLORS } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { useUserProgress } from '../../context/AppContext';

export default function HistoryScreen() {
  const { history, refreshHistory } = useUserProgress();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getModeIcon = (mode: 'free' | 'challenge' | undefined) => {
    return mode === 'challenge' ? '🏆' : '✏️';
  };

  const getModeLabel = (mode: 'free' | 'challenge' | undefined) => {
    return mode === 'challenge' ? 'Challenge' : 'Free Draw';
  };

  const renderItem = ({ item }: { item: PracticeSession }) => (
    <GlassCard style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeIcon}>{getModeIcon(item.mode)}</Text>
          <Text style={styles.modeLabel}>{getModeLabel(item.mode)}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionTime}>{formatDate(item.completedAt)}</Text>
          <Text style={styles.sessionDuration}>{item.durationMinutes} min</Text>
        </View>
      </View>

      {item.imageUri && (
        <View style={styles.imageRow}>
          <Image
            source={{ uri: item.imageUri }}
            style={styles.userImage}
            resizeMode="cover"
          />
          {item.referenceImageUri && (
            <View style={styles.referenceImageContainer}>
              <Text style={styles.referenceLabel}>Reference</Text>
              <Image
                source={{ uri: item.referenceImageUri }}
                style={styles.referenceImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.promptSection}>
        <Text style={styles.promptLabel}>
          {item.mode === 'challenge' ? 'Challenge' : 'My Intent'}
        </Text>
        <Text style={styles.promptText} numberOfLines={2}>
          {item.userIntent || item.prompt.content}
        </Text>
      </View>

      {item.feedback && (
        <View style={styles.feedbackSection}>
          <View style={styles.shoutoutRow}>
            <Text style={styles.shoutoutEmoji}>🌟</Text>
            <Text style={styles.shoutoutText} numberOfLines={2}>
              {item.feedback.shoutout}
            </Text>
          </View>

          {item.feedback.critiqueArea && (
            <View style={styles.critiqueSection}>
              <Text style={styles.critiqueAreaLabel}>Critique Focus</Text>
              <Text style={styles.critiqueAreaText}>{item.feedback.critiqueArea}</Text>
              {item.feedback.specificCritique && (
                <Text style={styles.specificCritiqueText}>{item.feedback.specificCritique}</Text>
              )}
            </View>
          )}

          {item.feedback.nextChallenge && (
            <View style={styles.nextChallengeSection}>
              <Text style={styles.nextChallengeLabel}>Next Challenge</Text>
              <Text style={styles.nextChallengeText}>{item.feedback.nextChallenge}</Text>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🎨</Text>
      <Text style={styles.emptyTitle}>No Practice Sessions Yet</Text>
      <Text style={styles.emptyText}>
        Complete a practice session to see your history here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{history.length} sessions completed</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} tintColor={COLORS.accent} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  sessionDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  userImage: {
    flex: 1,
    height: 120,
    borderRadius: 8,
  },
  referenceImageContainer: {
    width: 80,
  },
  referenceLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  referenceImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  promptSection: {
    marginBottom: 12,
  },
  promptLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  feedbackSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  shoutoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shoutoutEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  shoutoutText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textCharcoal,
    lineHeight: 20,
  },
  critiqueSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  critiqueAreaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  critiqueAreaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textCharcoal,
    marginBottom: 4,
  },
  specificCritiqueText: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
  },
  nextChallengeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(250, 112, 0, 0.1)',
    marginHorizontal: -12,
    marginBottom: -12,
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  nextChallengeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextChallengeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textCharcoal,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
