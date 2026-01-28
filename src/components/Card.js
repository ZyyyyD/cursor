import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export default function Card({ children, style, onPress, variant = 'default' }) {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outline' && styles.outline,
    variant === 'filled' && styles.filled,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.md,
  },
  elevated: {
    ...shadow.lg,
  },
  outline: {
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.surfaceHover,
    ...shadow.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
