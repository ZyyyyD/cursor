import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function MetricCard({ 
  label, 
  value, 
  icon, 
  iconBg = colors.primaryLight, 
  iconColor = colors.primary,
  onPress,
  compact = false,
}) {
  return (
    <Pressable 
      style={[styles.card, compact && styles.cardCompact]} 
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={compact ? 18 : 22} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  cardCompact: {
    padding: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    ...typography.metric,
    color: colors.textPrimary,
  },
  valueCompact: {
    ...typography.metricSmall,
  },
});
