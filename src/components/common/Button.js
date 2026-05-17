import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

export default function Button({ label, onPress, variant = 'primary', icon, style, labelStyle }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const buttonStyle = [
    styles.button,
    isPrimary 
      ? { backgroundColor: c.accent, borderColor: c.accent } 
      : isSecondary 
        ? { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder } 
        : { backgroundColor: 'transparent', borderColor: c.surfaceBorder },
    style
  ];

  const textColor = isPrimary 
    ? c.white 
    : c.textPrimary;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={textColor}
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.text,
          { color: textColor },
          labelStyle
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8, // Precision 8px from docs/DESIGN.md
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.base - 1,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
});
