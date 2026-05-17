import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Themes } from '../../constants/themes';

export default function ThemeSelector({ selected, onSelect }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  const themesList = Object.keys(Themes)
    .filter(key => key !== 'system-default')
    .map(key => ({
      value: key,
      label: Themes[key].name,
      bg: Themes[key].colors.background,
      surface: Themes[key].colors.surfaceContainer,
      accent: Themes[key].colors.accent,
      text: Themes[key].colors.textPrimary,
    }));

  return (
    <View style={styles.gridContainer}>
      {themesList.map((theme) => {
        const isSelected = selected === theme.value;
        return (
          <TouchableOpacity
            key={theme.value}
            style={[
              styles.themeCard,
              { 
                borderColor: isSelected ? theme.accent : c.surfaceBorder,
                backgroundColor: c.surfaceContainerLow
              }
            ]}
            onPress={() => onSelect(theme.value)}
            activeOpacity={0.8}
          >
            {/* Visual Swatch */}
            <View style={[styles.swatch, { backgroundColor: theme.bg }]}>
              <View style={[styles.swatchSurface, { backgroundColor: theme.surface }]}>
                <View style={[styles.swatchAccent, { backgroundColor: theme.accent }]} />
                <View style={[styles.swatchText, { backgroundColor: theme.text }]} />
                <View style={[styles.swatchText, { backgroundColor: theme.text, width: '40%' }]} />
              </View>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: theme.accent, borderColor: theme.bg }]}>
                  <Feather name="check" size={12} color="#FFF" />
                </View>
              )}
            </View>
            
            {/* Theme Name */}
            <Text 
              numberOfLines={1}
              style={[
                styles.label,
                { color: isSelected ? theme.accent : c.textSecondary },
                isSelected && { fontWeight: FontWeights.bold }
              ]}
            >
              {theme.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  themeCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    width: '30.5%', // 3 columns beautifully spaced
    minWidth: 90,
  },
  swatch: {
    width: '100%',
    height: 72,
    borderRadius: 8,
    padding: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  swatchSurface: {
    flex: 1,
    borderRadius: 6,
    padding: 4,
    gap: 3,
  },
  swatchAccent: {
    height: 5,
    borderRadius: 2.5,
    width: '35%',
    marginBottom: 3,
  },
  swatchText: {
    height: 3,
    borderRadius: 1.5,
    width: '80%',
    opacity: 0.5,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  }
});
