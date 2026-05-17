import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

export default function Badge({ label, variant = 'neutral', style, icon }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  let bgColor = c.surfaceContainerLow;
  let borderColor = c.surfaceBorder;
  let textColor = c.textSecondary;
  let iconName = icon || null;

  if (variant === 'success') {
    bgColor = c.primaryContainerLight || 'rgba(156, 175, 136, 0.15)'; // Sage Green tint
    borderColor = c.primaryBorderSubtle || 'rgba(156, 175, 136, 0.3)';
    textColor = c.success || '#9CAF88';
    iconName = icon || 'check-circle';
  } else if (variant === 'risk') {
    bgColor = 'rgba(232, 93, 42, 0.1)'; // Accent Soft/Orange tint
    borderColor = 'rgba(232, 93, 42, 0.25)';
    textColor = c.accent || '#E85D2A';
    iconName = icon || 'alert-triangle';
  } else if (variant === 'active') {
    bgColor = 'rgba(232, 93, 42, 0.1)';
    borderColor = 'rgba(232, 93, 42, 0.25)';
    textColor = c.accent || '#E85D2A';
    iconName = icon || 'activity';
  } else if (variant === 'relevant') {
    bgColor = c.primaryContainerLight || 'rgba(156, 175, 136, 0.15)';
    borderColor = c.primaryBorderSubtle || 'rgba(156, 175, 136, 0.3)';
    textColor = c.primary || '#9CAF88';
    iconName = icon || 'compass';
  } else if (variant === 'ignored') {
    bgColor = c.surfaceContainerLowest;
    borderColor = c.surfaceBorder;
    textColor = c.textSecondary;
    iconName = icon || 'eye-off';
  } else if (variant === 'high-impact') {
    bgColor = 'rgba(242, 193, 78, 0.1)'; // Muted Gold tint
    borderColor = 'rgba(242, 193, 78, 0.3)';
    textColor = '#F2C14E'; // Gold color from DESIGN.md
    iconName = icon || 'zap';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }, style]}>
      {iconName && (
        <Feather
          name={iconName}
          size={12}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 9999, // Pill shape from docs/DESIGN.md
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
