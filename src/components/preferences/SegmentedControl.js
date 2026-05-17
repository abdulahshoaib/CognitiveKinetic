import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes } from '../../constants/typography';

export default function SegmentedControl({ options, selected, onSelect }) {
  const { activeTheme } = usePreferences();
  const themeColors = activeTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.l2Surface, borderColor: themeColors.l2Border }]}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && { backgroundColor: themeColors.surfaceVariant, borderColor: themeColors.surfaceBorder }
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.text,
              { color: isSelected ? themeColors.textPrimary : themeColors.textSecondary },
              isSelected && styles.textSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    marginTop: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  textSelected: {
    fontWeight: '700',
  }
});
