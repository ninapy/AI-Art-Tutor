import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  showOverflow?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = COLORS.accent,
  backgroundColor = COLORS.border,
  children,
  showOverflow = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - clampedProgress * circumference;
  const isOverflow = progress > 1;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={isOverflow && showOverflow ? '#10B981' : color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
      {isOverflow && showOverflow && (
        <View style={{ position: 'absolute', top: -5, right: -5 }}>
          <View style={{ 
            backgroundColor: '#10B981', 
            borderRadius: 12, 
            paddingHorizontal: 6, 
            paddingVertical: 2 
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>+{Math.round((progress - 1) * 100)}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}
