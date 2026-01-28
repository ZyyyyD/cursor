import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, spacing, typography } from '../theme';

export default function SearchBar({ placeholder = 'Search...', value, onChangeText, style }) {
  return (
    <View style={[styles.container, style]}>
      <Icon name="search" size={20} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
});
