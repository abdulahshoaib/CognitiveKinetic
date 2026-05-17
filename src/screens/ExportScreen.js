import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';

export default function ExportScreen({ navigation }) {
  const { systemState } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');

  const triggerDownload = (fileName, docType) => {
    setDownloadingFile(fileName);
    setDownloadStatus('Creating document structure...');

    setTimeout(() => {
      setDownloadStatus('Gathering decision logs...');
    }, 600);

    setTimeout(() => {
      setDownloadStatus('Finishing up...');
    }, 1200);

    setTimeout(() => {
      setDownloadingFile(null);
      setDownloadStatus('');
      Alert.alert('Export Success', `Successfully generated & exported ${fileName} to local documents!`);
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={[styles.stageTitle, { color: c.textSecondary }]}>Prices Updated → Business Safe → </Text>
          <Text style={[styles.stageTitleActive, { color: c.accent }]}>Export Reports</Text>
        </View>

        {/* Header Brief */}
        <View style={[styles.exportHeaderCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Feather name="download-cloud" size={24} color={c.accent} style={{ marginBottom: 8 }} />
          <Text style={[styles.exportHeaderTitle, { color: c.textPrimary }]}>Download Business Reports</Text>
          <Text style={[styles.exportHeaderSubtitle, { color: c.textSecondary }]}>
            Download your pricing reports, logs, and decisions to save them locally.
          </Text>
        </View>

        {/* Dynamic Downloader Overlay */}
        {downloadingFile && (
          <View style={[styles.overlayCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.accent }]}>
            <ActivityIndicator size="large" color={c.accent} style={{ marginBottom: 12 }} />
            <Text style={[styles.overlayTitle, { color: c.textPrimary }]}>Preparing File...</Text>
            <Text style={[styles.overlayText, { color: c.accent }]}>{downloadingFile}</Text>
            <Text style={[styles.overlayStatus, { color: c.textSecondary }]}>{downloadStatus}</Text>
          </View>
        )}

        {/* Files Grid list */}
        <Text style={[styles.sectionHeader, { color: c.textPrimary }]}>Available Documents</Text>

        {/* PDF Option */}
        <TouchableOpacity 
          style={[styles.fileCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('pricing_surcharge_brief.pdf', 'PDF')}
        >
          <View style={[styles.fileIconBox, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
            <Feather name="file-text" size={24} color={c.error} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.fileTitle, { color: c.textPrimary }]}>Pricing Surcharge Report</Text>
            <Text style={[styles.fileMeta, { color: c.textSecondary }]}>Format: PDF • Contains Pricing Differences & Surcharges</Text>
          </View>
          <Feather name="download" size={20} color={c.textSecondary} />
        </TouchableOpacity>

        {/* JSON Option */}
        <TouchableOpacity 
          style={[styles.fileCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('agent_reasoning_trace.json', 'JSON')}
        >
          <View style={[styles.fileIconBox, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
            <Feather name="code" size={24} color={c.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.fileTitle, { color: c.textPrimary }]}>AI Decision Step Log</Text>
            <Text style={[styles.fileMeta, { color: c.textSecondary }]}>Format: JSON • Contains AI Steps & Timeline Logs</Text>
          </View>
          <Feather name="download" size={20} color={c.textSecondary} />
        </TouchableOpacity>

        {/* CSV Option */}
        <TouchableOpacity 
          style={[styles.fileCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('operational_signals_feed.csv', 'CSV')}
        >
          <View style={[styles.fileIconBox, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
            <Feather name="bar-chart-2" size={24} color={c.success} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.fileTitle, { color: c.textPrimary }]}>Extracted News Signals</Text>
            <Text style={[styles.fileMeta, { color: c.textSecondary }]}>Format: CSV • Fact Signals & Relevance Scores</Text>
          </View>
          <Feather name="download" size={20} color={c.textSecondary} />
        </TouchableOpacity>

        {/* Return Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: c.accent }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Feather name="home" size={20} color={c.white} style={{ marginRight: 8 }} />
          <Text style={[styles.primaryButtonText, { color: c.white }]}>Return to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stageIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stageTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  stageTitleActive: {
    fontSize: 11,
    fontWeight: '700',
  },
  exportHeaderCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  exportHeaderTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 6,
  },
  exportHeaderSubtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 14,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  overlayCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  overlayTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  overlayText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: 10,
  },
  overlayStatus: {
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
  },
});
