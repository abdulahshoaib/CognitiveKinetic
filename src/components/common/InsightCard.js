import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import StatusPill from './StatusPill';

export default function InsightCard({ insight, style }) {
  if (!insight) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bulb" size={20} color={Colors.accent} />
        </View>
        <StatusPill label={insight.category || 'Insight'} status="accent" />
      </View>
      
      <Text style={styles.title}>{insight.title}</Text>
      <Text style={styles.description}>{insight.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryContainerLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBorderMedium,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
