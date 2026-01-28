import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';

export default function DonutChart({ 
  size = 120, 
  strokeWidth = 12, 
  data = [], 
  centerValue,
  centerLabel,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate segments
  let currentAngle = -90; // Start from top
  const segments = data.map((item) => {
    const percentage = item.value / total;
    const strokeDasharray = circumference * percentage;
    const strokeDashoffset = 0;
    const rotation = currentAngle;
    currentAngle += percentage * 360;
    return { ...item, strokeDasharray, rotation, percentage };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Data segments */}
        {segments.map((segment, index) => (
          <G key={index} rotation={segment.rotation} origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.strokeDasharray} ${circumference}`}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        ))}
      </Svg>
      {/* Center content */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={styles.centerValue}>{centerValue}</Text>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    ...typography.metric,
    color: colors.textPrimary,
  },
  centerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
