import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import StatusPill from './StatusPill';
import { usePreferences } from '../../context/PreferencesContext';

export default function ContentItemCard({ item, onPress, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (!item) return null;

  const getSourceIcon = (type) => {
    switch (type) {
      case 'news': return 'newspaper-outline';
      case 'alert': return 'warning-outline';
      case 'sports': return 'football-outline';
      case 'entertainment': return 'film-outline';
      case 'manual': return 'create-outline';
      default: return 'document-text-outline';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, style]} 
      onPress={() => onPress && onPress(item)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.sourceInfo}>
          <Ionicons name={getSourceIcon(item.sourceType)} size={16} color={c.textSecondary} />
          <Text style={[styles.sourceName, { color: c.textSecondary }]}>{item.sourceName}</Text>
        </View>
        <Text style={[styles.timestamp, { color: c.textSecondary }]}>{item.timestamp}</Text>
      </View>
      
      <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]} numberOfLines={3}>{item.body}</Text>
      
      <View style={[styles.footer, { borderTopColor: c.surfaceBorderSubtle }]}>
        <View style={styles.topicsRow}>
          {item.detectedTopics?.slice(0, 2).map((topic, idx) => (
            <View key={idx} style={[styles.topicChip, { backgroundColor: c.surfaceVariant }]}>
              <Text style={[styles.topicText, { color: c.textSecondary }]}>{topic}</Text>
            </View>
          ))}
          {item.detectedTopics?.length > 2 && (
            <Text style={[styles.topicText, { color: c.textSecondary }]}>+{item.detectedTopics.length - 2}</Text>
          )}
        </View>
        <StatusPill label={item.relevanceStatus} status={item.relevanceStatus} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  sourceName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    flexShrink: 1,
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    flexShrink: 0,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
    lineHeight: 20,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderSubtle,
    paddingTop: 12,
  },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  topicChip: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  topicText: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
});
