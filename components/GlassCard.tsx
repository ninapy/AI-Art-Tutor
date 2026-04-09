import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function GlassCard({ children, style, onPress }: GlassCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
