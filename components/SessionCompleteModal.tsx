import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/theme';
import { GlassCard } from './GlassCard';

interface SessionCompleteModalProps {
  visible: boolean;
  imageUri: string;
  suggestedMinutes: number;
  onComplete: (minutes: number) => void;
  onCancel: () => void;
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export function SessionCompleteModal({
  visible,
  imageUri,
  suggestedMinutes,
  onComplete,
  onCancel,
}: SessionCompleteModalProps) {
  const [minutes, setMinutes] = useState(
    DURATION_OPTIONS.includes(suggestedMinutes) ? suggestedMinutes : 10
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <GlassCard style={styles.content}>
        <Text style={styles.title}>Finalize Session</Text>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>

        <Text style={styles.question}>How many minutes did you spend?</Text>
        
        <View style={styles.minutesDisplay}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setMinutes((m) => Math.max(1, m - 5))}
          >
            <Text style={styles.adjustButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.minutesBox}>
            <Text style={styles.minutesText}>{minutes}</Text>
            <Text style={styles.minutesLabel}>minutes</Text>
          </View>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => setMinutes((m) => Math.min(120, m + 5))}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickButtons}>
          {DURATION_OPTIONS.slice(0, 5).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.quickButton, minutes === m && styles.quickButtonActive]}
              onPress={() => setMinutes(m)}
            >
              <Text style={[styles.quickButtonText, minutes === m && styles.quickButtonTextActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(minutes)}>
            <Text style={styles.completeButtonText}>Save Session</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textCharcoal,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textCharcoal,
    textAlign: 'center',
    marginBottom: 16,
  },
  minutesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  minutesBox: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  minutesText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.accent,
  },
  minutesLabel: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    minWidth: 48,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: COLORS.accent,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  quickButtonTextActive: {
    color: COLORS.white,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
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
  completeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
