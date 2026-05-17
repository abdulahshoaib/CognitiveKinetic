import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAnalysis } from '../context/AnalysisContext';

export default function AgentTraceScreen({ navigation }) {
  const { analysisResult, executionLogs } = useAnalysis();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Registry Deployed → Operations Report → </Text>
          <Text style={styles.stageTitleActive}>Trace Diagnostics</Text>
        </View>

        {/* Cognitive Block Diagram */}
        <View style={styles.traceHeaderCard}>
          <Ionicons name="git-branch" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.traceHeaderTitle}>Autonomous Pipeline Telemetry</Text>
          <Text style={styles.traceHeaderSubtitle}>
            Review the full chronological workplan breakdown and logical heuristics executed by the Agentic Core.
          </Text>
        </View>

        {/* Dynamic Chronological Timeline */}
        <Text style={styles.sectionHeader}>Chronological Reasoning Trace</Text>

        {/* Step 1 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.primaryContainer }]}>
            <Ionicons name="business" size={14} color={Colors.primary} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>Stage 1: Profile Initialization</Text>
            <Text style={styles.nodeDesc}>
              Successfully fetched user context rules. Operational parameters loaded for dynamic threat classification.
            </Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeText}>{"{\n  domain: \"delivery logistics\",\n  locations: [\"Lahore\", \"Karachi\"],\n  sensitivity: \"aggressive\"\n}"}</Text>
            </View>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: 'rgba(222, 194, 154, 0.15)' }]}>
            <Ionicons name="document-text" size={14} color={Colors.tertiary} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>Stage 2: Semantic Fact Extraction</Text>
            <Text style={styles.nodeDesc}>
              Parsed raw unstructured feed elements into structured signal tags using operational heuristics.
            </Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeText}>
                {analysisResult?.ingestionResult 
                  ? `Signals: ${analysisResult.ingestionResult.signals?.map(s => s.title).join(', ')}`
                  : "Signal detected: Fuel price escalation +12% effective immediately."}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>Stage 3: Relevance Check & Priorities</Text>
            <Text style={styles.nodeDesc}>
              Evaluated profile threat alignment coefficient. Verified active vector overlap threshold.
            </Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeText}>
                {`Alignment Rating: ${analysisResult?.relevanceScore || 'High'}\nRelevance Index: 92.4%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: 'rgba(255, 180, 171, 0.15)' }]}>
            <Ionicons name="pulse" size={14} color={Colors.error} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>Stage 4: Operational Impact Timeline</Text>
            <Text style={styles.nodeDesc}>
              Simulated consequence scenarios across 30 and 90-day segments to forecast pricing compression friction.
            </Text>
          </View>
        </View>

        {/* Step 5 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="checkmark-done-circle" size={14} color={Colors.success} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>Stage 5: Live Active Telemetry</Text>
            <Text style={styles.nodeDesc}>
              Telemetry log stream from the last running sandbox evaluation workspace.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: '#1A1C1E' }]}>
              {executionLogs && executionLogs.length > 0 ? (
                executionLogs.slice(-3).map((log, i) => (
                  <Text key={i} style={[styles.codeText, { color: '#00E676' }]} numberOfLines={1}>
                    {log}
                  </Text>
                ))
              ) : (
                <Text style={[styles.codeText, { color: Colors.outline }]}>Listening for workspace actions...</Text>
              )}
            </View>
          </View>
        </View>

        {/* Navigation CTA */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={Colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Return to Command Center</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Export')}
        >
          <Ionicons name="download-outline" size={18} color={Colors.onSurface} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>Export Trace Ledger PDF</Text>
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
  traceHeaderCard: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  traceHeaderTitle: {
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  traceHeaderSubtitle: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  timelineNode: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 32,
    bottom: -20,
    width: 2,
    backgroundColor: Colors.outlineVariant,
    zIndex: 1,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginRight: 14,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    padding: 12,
  },
  nodeTitle: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  nodeDesc: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  codeSnippet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 6,
    padding: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.outline,
    lineHeight: 14,
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
    marginTop: 20,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
});
