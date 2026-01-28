import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

export default function Screen({ children, style, noPadding }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.container, noPadding && styles.noPadding, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  noPadding: {
    paddingHorizontal: 0,
  },
});
