import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

export default function SectionHeader({ title, action, onAction, icon }) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {icon && <Icon name={icon} size={18} color={colors.textPrimary} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.action}>{action}</Text>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  action: {
    ...typography.captionMedium,
    color: colors.primary,
  },
});
