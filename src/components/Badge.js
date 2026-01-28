import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const statusColors = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.infoLight, text: colors.info },
  default: { bg: colors.borderLight, text: colors.textSecondary },
};

export default function Badge({ label, status = 'default', size = 'md' }) {
  const colorSet = statusColors[status] || statusColors.default;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: colorSet.text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  text: {
    ...typography.captionMedium,
  },
  textSmall: {
    ...typography.small,
  },
});
