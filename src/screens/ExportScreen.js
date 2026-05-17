import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAnalysis } from '../context/AnalysisContext';

export default function ExportScreen({ navigation }) {
  const { systemState } = useAnalysis();
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');

  const triggerDownload = (fileName, docType) => {
    setDownloadingFile(fileName);
    setDownloadStatus('Preparing Document Structure...');

    setTimeout(() => {
      setDownloadStatus('Compiling Telemetry Metadata...');
    }, 600);

    setTimeout(() => {
      setDownloadStatus('Encrypting & Packaging Rules...');
    }, 1200);

    setTimeout(() => {
      setDownloadingFile(null);
      setDownloadStatus('');
      alert(`Successfully generated & exported ${fileName} to local documents!`);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Registry Deployed → Trace Diagnostics → </Text>
          <Text style={styles.stageTitleActive}>Documentation Export</Text>
        </View>

        {/* Header Brief */}
        <View style={styles.exportHeaderCard}>
          <Ionicons name="cloud-download-outline" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.exportHeaderTitle}>Administrative Report Exports</Text>
          <Text style={styles.exportHeaderSubtitle}>
            Compile and compile authenticated document files representing the optimized surcharge policies and agent trace execution streams.
          </Text>
        </View>

        {/* Dynamic Downloader Overlay */}
        {downloadingFile && (
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.overlayTitle}>Compiling Ledger File</Text>
            <Text style={styles.overlayText}>{downloadingFile}</Text>
            <Text style={styles.overlayStatus}>{downloadStatus}</Text>
          </View>
        )}

        {/* Files Grid list */}
        <Text style={styles.sectionHeader}>Available Assets for Export</Text>

        {/* PDF Option */}
        <TouchableOpacity 
          style={styles.fileCard}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('pricing_surcharge_brief.pdf', 'PDF')}
        >
          <View style={styles.fileIconBox}>
            <Ionicons name="document-text" size={24} color={Colors.error} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fileTitle}>Pricing Surcharge Executive Brief</Text>
            <Text style={styles.fileMeta}>Format: PDF • Contains Pricing Compare & Surcharges</Text>
          </View>
          <Ionicons name="download-outline" size={20} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* JSON Option */}
        <TouchableOpacity 
          style={styles.fileCard}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('agent_reasoning_trace.json', 'JSON')}
        >
          <View style={styles.fileIconBox}>
            <Ionicons name="code-working" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fileTitle}>Agent Cognitive Reasoning Trace</Text>
            <Text style={styles.fileMeta}>Format: JSON • Steps, Timelines & Telemetry Logs</Text>
          </View>
          <Ionicons name="download-outline" size={20} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* CSV Option */}
        <TouchableOpacity 
          style={styles.fileCard}
          disabled={!!downloadingFile}
          onPress={() => triggerDownload('operational_signals_feed.csv', 'CSV')}
        >
          <View style={styles.fileIconBox}>
            <Ionicons name="analytics" size={24} color={Colors.success} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fileTitle}>Ingested Operational Signals Ledger</Text>
            <Text style={styles.fileMeta}>Format: CSV • Fact Signals & Relevance Indices</Text>
          </View>
          <Ionicons name="download-outline" size={20} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Return Button */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={Colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Return to Command Center</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.outline,
    fontSize: 11,
    fontWeight: '500',
  },
  stageTitleActive: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  exportHeaderCard: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  exportHeaderTitle: {
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  exportHeaderSubtitle: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTitle: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  fileMeta: {
    color: Colors.outline,
    fontSize: 10,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 32,
  },
  primaryButtonText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  overlayCard: {
    backgroundColor: 'rgba(26, 28, 30, 0.95)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  overlayTitle: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  overlayText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  overlayStatus: {
    color: Colors.outline,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
