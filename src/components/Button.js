import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  style,
}) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isSmall = size === 'sm';

  const buttonStyle = [
    styles.button,
    isSmall && styles.buttonSmall,
    isOutline && styles.buttonOutline,
    isGhost && styles.buttonGhost,
    isDanger && styles.buttonDanger,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    isSmall && styles.textSmall,
    isOutline && styles.textOutline,
    isGhost && styles.textGhost,
    isDanger && styles.textDanger,
  ];

  const iconColor = isOutline || isGhost ? colors.primary : colors.surface;

  const content = (
    <View style={styles.content}>
      {icon && <Icon name={icon} size={isSmall ? 16 : 18} color={iconColor} />}
      <Text style={textStyle}>{title}</Text>
      {iconRight && <Icon name={iconRight} size={isSmall ? 16 : 18} color={iconColor} />}
    </View>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, isSmall && styles.buttonSmall, styles.gradient, style]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [buttonStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    ...shadow.sm,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  gradient: {
    ...shadow.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  textSmall: {
    ...typography.captionMedium,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
