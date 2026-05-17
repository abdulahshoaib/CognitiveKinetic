import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

export default function StatusPill({ label, status = 'default', style }) {
  const { activeTheme } = usePreferences();
  const themeColors = activeTheme.colors;

  const getStatusStyles = () => {
    switch (status) {
      case 'success':
      case 'high-impact':
        return {
          bg: themeColors.successSoft,
          border: themeColors.successBorder,
          text: themeColors.success,
        };
      case 'warning':
      case 'pending':
        return {
          bg: themeColors.warningSoft,
          border: themeColors.warningBorder,
          text: themeColors.warning,
        };
      case 'danger':
      case 'ignored':
        return {
          bg: themeColors.dangerSoft,
          border: themeColors.dangerMedium,
          text: themeColors.danger,
        };
      case 'accent':
      case 'relevant':
        return {
          bg: themeColors.accentSoft,
          border: themeColors.accentBorder,
          text: themeColors.accent,
        };
      case 'default':
      default:
        return {
          bg: themeColors.surfaceVariant,
          border: themeColors.outlineVariantMedium,
          text: themeColors.onSurfaceVariant,
        };
    }
  };

  const s = getStatusStyles();

  return (
    <View style={[styles.container, { backgroundColor: s.bg, borderColor: s.border }, style]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
});
