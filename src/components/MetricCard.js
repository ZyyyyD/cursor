import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";
import { radius, shadow, spacing, typography } from "../theme";
import { useTheme } from "../theme/ThemeContext";

export default function MetricCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  onPress,
  compact = false,
}) {
  const { colors } = useTheme();
  const bgColor = iconBg || colors.primaryLight;
  const textColor = iconColor || colors.primary;

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        compact && styles.cardCompact,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={compact ? 18 : 22} color={textColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text
          style={[
            styles.value,
            { color: colors.textPrimary },
            compact && styles.valueCompact,
          ]}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    marginBottom: 2,
  },
  value: {
    ...typography.metric,
  },
  valueCompact: {
    ...typography.metricSmall,
  },
});
