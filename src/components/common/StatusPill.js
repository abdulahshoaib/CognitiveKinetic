import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function StatusPill({ label, status = 'default', style }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
      case 'high-impact':
        return {
          bg: Colors.successSoft,
          border: Colors.successBorder,
          text: Colors.success,
        };
      case 'warning':
      case 'pending':
        return {
          bg: Colors.warningSoft,
          border: Colors.warningBorder,
          text: Colors.warning,
        };
      case 'danger':
      case 'ignored':
        return {
          bg: Colors.dangerSoft,
          border: Colors.dangerMedium,
          text: Colors.danger,
        };
      case 'accent':
      case 'relevant':
        return {
          bg: Colors.accentSoft,
          border: Colors.accentBorder,
          text: Colors.accent,
        };
      case 'default':
      default:
        return {
          bg: Colors.surfaceVariant,
          border: Colors.outlineVariantMedium,
          text: Colors.onSurfaceVariant,
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
