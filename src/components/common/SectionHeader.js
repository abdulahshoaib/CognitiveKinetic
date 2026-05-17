import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function SectionHeader({ title, subtitle, rightElement, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    lineHeight: 28,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  right: {
    flexShrink: 0,
  },
});
