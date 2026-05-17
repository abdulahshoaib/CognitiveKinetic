import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes } from '../../constants/typography';

export default function SettingRow({ title, description, children }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <View style={[styles.container, { borderBottomColor: c.surfaceBorderSubtle }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: c.textSecondary }]}>{description}</Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  textContainer: {
    marginBottom: 4,
  },
  title: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
  }
});
