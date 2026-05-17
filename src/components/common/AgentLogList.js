import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

export default function AgentLogList({ logs, limit = 5, style }) {
  const [expanded, setExpanded] = useState(false);
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const normalizeLog = (log, index) => {
    if (typeof log === 'string') {
      return { id: index, message: log, level: 'info' };
    }

    if (!log || typeof log !== 'object') {
      return { id: index, message: String(log ?? ''), level: 'info' };
    }

    const message = typeof log.message === 'string'
      ? log.message
      : JSON.stringify(log.message ?? log);

    return {
      id: log.id || index,
      timestamp: log.timestamp || '',
      stage: log.stage,
      level: log.level || 'info',
      message,
    };
  };

  if (!logs || logs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.surfaceContainerHighest, borderColor: c.surfaceBorder }, style]}>
        <Text style={[styles.emptyText, { color: c.textSecondary }]}>No logs available</Text>
      </View>
    );
  }

  const displayLogs = expanded ? logs : logs.slice(-limit);

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerHighest, borderColor: c.surfaceBorder }, style]}>
      <View style={[styles.header, { backgroundColor: c.surfaceContainerLow, borderBottomColor: c.surfaceBorder }]}>
        <Text style={[styles.headerText, { color: c.textSecondary }]}>Execution Logs</Text>
        {logs.length > limit && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={[styles.toggleText, { color: c.accent }]}>{expanded ? 'Show Less' : `Show All (${logs.length})`}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.logContainer}>
        {displayLogs.map((entry, index) => {
          const log = normalizeLog(entry, index);
          let color = c.textSecondary;
          if (log.level === 'error') color = c.danger;
          if (log.level === 'success') color = c.success;
          
          return (
            <View key={log.id || index} style={styles.logLine}>
              <Text style={[styles.timestamp, { color: c.textSecondary }]}>{log.timestamp || ''}</Text>
              <Text style={[styles.message, { color }]}>
                {log.stage ? `[${log.stage}] ` : ''}{log.message}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceContainerLow,
  },
  headerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  toggleText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
  },
  logContainer: {
    padding: 12,
    maxHeight: 250,
  },
  logLine: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginRight: 8,
    width: 65,
  },
  message: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    padding: 16,
    textAlign: 'center',
  },
});
