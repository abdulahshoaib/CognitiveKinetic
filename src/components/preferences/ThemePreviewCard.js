import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes } from '../../constants/typography';
import { Ionicons } from '@expo/vector-icons';

export default function ThemePreviewCard() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <View style={[styles.previewContainer, { backgroundColor: c.background, borderColor: c.l1Border }]}>
      <Text style={[styles.previewTitle, { color: c.textSecondary }]}>Live Preview</Text>
      
      <View style={[styles.card, { backgroundColor: c.l1Surface, borderColor: c.l1Border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: c.primaryContainerLight, borderColor: c.primaryBorderSubtle }]}>
            <Text style={[styles.badgeText, { color: c.primary }]}>Insight Generated</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: c.success }]} />
        </View>

        <Text style={[styles.mainText, { color: c.textPrimary }]}>
          Agent detected pattern matching your profile. System is ready.
        </Text>

        <View style={styles.actionRow}>
          <View style={[styles.primaryButton, { backgroundColor: c.accent }]}>
            <Text style={[styles.buttonText, { color: c.textInverse || '#181C18' }]}>Run Simulation</Text>
          </View>
          <View style={[styles.secondaryButton, { borderColor: c.outlineVariantMedium }]}>
            <Ionicons name="options-outline" size={16} color={c.textSecondary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mainText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
  }
});
