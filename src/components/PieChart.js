import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors, radius, spacing, typography } from '../theme';

export default function PieChart({ 
  data = [], 
  size = 160, 
  showLegend = true,
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const outerRadius = size / 2 - 4;
  
  // Calculate pie segments
  let currentAngle = -Math.PI / 2; // Start from top
  const segments = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path
    const x1 = center + outerRadius * Math.cos(startAngle);
    const y1 = center + outerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(endAngle);
    const y2 = center + outerRadius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const d = `M ${center} ${center} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, d, percentage };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {segments.map((segment, index) => (
              <Path
                key={index}
                d={segment.d}
                fill={segment.color}
                stroke={colors.surface}
                strokeWidth={2}
              />
            ))}
          </G>
        </Svg>
        {/* Percentage labels on chart */}
        {segments.map((segment, index) => {
          const midAngle = -Math.PI / 2 + (index + 0.5) * (2 * Math.PI * segment.percentage);
          const labelRadius = outerRadius * 0.65;
          const x = center + labelRadius * Math.cos(midAngle - Math.PI / 2 + index * 2 * Math.PI * segment.percentage / 2);
          const y = center + labelRadius * Math.sin(midAngle - Math.PI / 2 + index * 2 * Math.PI * segment.percentage / 2);
          if (segment.percentage < 0.05) return null;
          return (
            <View key={index} style={[styles.percentLabel, { 
              position: 'absolute',
              left: size / 2 + (size * 0.3) * Math.cos(-Math.PI / 2 + (data.slice(0, index).reduce((sum, d) => sum + d.value / total, 0) + segment.percentage / 2) * 2 * Math.PI) - 15,
              top: size / 2 + (size * 0.3) * Math.sin(-Math.PI / 2 + (data.slice(0, index).reduce((sum, d) => sum + d.value / total, 0) + segment.percentage / 2) * 2 * Math.PI) - 8,
            }]}>
              <Text style={styles.percentText}>{Math.round(segment.percentage * 100)}%</Text>
            </View>
          );
        })}
      </View>
      
      {showLegend && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  percentLabel: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  percentText: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
