import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TIMER_PRESETS } from '../constants/theme';
import { ProgressRing } from './ProgressRing';

interface CountdownTimerProps {
  onComplete?: (durationMinutes: number) => void | Promise<void>;
  onCancel?: () => void;
  initialMinutes?: number;
}

export function CountdownTimer({
  onComplete,
  onCancel,
  initialMinutes = 10,
}: CountdownTimerProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(initialMinutes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = selectedDuration * 60;
  const elapsedSeconds = (selectedDuration - minutes) * 60 + seconds;
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              setIsRunning(false);
              onComplete?.(selectedDuration);
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, minutes, onComplete]);

  const handleStart = () => {
    setMinutes(selectedDuration);
    setSeconds(0);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(selectedDuration);
    setSeconds(0);
  };

  const handleSelectDuration = (duration: number) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setMinutes(duration);
      setSeconds(0);
    }
  };

  const formatTime = (m: number, s: number) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ProgressRing 
        progress={progress} 
        size={140} 
        strokeWidth={10} 
        color={COLORS.accent} 
        backgroundColor={COLORS.border}
      >
        <Text style={styles.timerText}>{formatTime(minutes, seconds)}</Text>
        <Text style={styles.timerLabel}>
          {isRunning ? 'In Progress' : minutes === selectedDuration && seconds === 0 ? 'Ready' : 'Paused'}
        </Text>
      </ProgressRing>

      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.durationSelector}>
        <Text style={styles.durationLabel}>Duration</Text>
        <View style={styles.durationOptions}>
          {TIMER_PRESETS.map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationOption,
                selectedDuration === duration && styles.durationOptionSelected,
              ]}
              onPress={() => handleSelectDuration(duration)}
              disabled={isRunning}
            >
              <Text
                style={[
                  styles.durationOptionText,
                  selectedDuration === duration && styles.durationOptionTextSelected,
                ]}
              >
                {duration}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    maxHeight: 400,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textCharcoal,
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  startButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  pauseButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pauseButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  resetButton: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: COLORS.textCharcoal,
    fontWeight: '500',
    fontSize: 15,
  },
  durationSelector: {
    marginTop: 20,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textCharcoal,
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 280,
  },
  durationOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    minWidth: 56,
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  durationOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textCharcoal,
  },
  durationOptionTextSelected: {
    color: COLORS.white,
  },
});
