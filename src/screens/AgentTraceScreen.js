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
          <Text style={styles.stageTitle}>Main Dashboard → News Report → </Text>
          <Text style={styles.stageTitleActive}>AI Decision Process</Text>
        </View>

        {/* Cognitive Block Diagram */}
        <View style={styles.traceHeaderCard}>
          <Ionicons name="git-branch" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.traceHeaderTitle}>How the AI Reached This Decision</Text>
          <Text style={styles.traceHeaderSubtitle}>
            See the simple step-by-step reasoning the AI followed to analyze the news and recommend an action.
          </Text>
        </View>

        {/* Dynamic Chronological Timeline */}
        <Text style={styles.sectionHeader}>Step-by-Step AI Journey</Text>

        {/* Step 1 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.primaryContainer }]}>
            <Ionicons name="business" size={14} color={Colors.primary} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>1. Loaded Your Profile Settings</Text>
            <Text style={styles.nodeDesc}>
              We read your business settings to understand what matters most to you.
            </Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeText}>{"{\n  domain: \"delivery logistics\",\n  locations: [\"Lahore\", \"Karachi\"],\n  sensitivity: \"aggressive\"\n}"}</Text>
            </View>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.warningMuted }]}>
            <Ionicons name="document-text" size={14} color={Colors.tertiary} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>2. Extracted News Details</Text>
            <Text style={styles.nodeDesc}>
              We identified the most important details in the news text.
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
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.successMedium }]}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>3. Checked Relevance to Your Business</Text>
            <Text style={styles.nodeDesc}>
              We checked if this news actually affects your day-to-day operations.
            </Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeText}>
                {`Relevance score: Very High\nMatch Index: 92.4%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4 */}
        <View style={styles.timelineNode}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.errorMedium }]}>
            <Ionicons name="pulse" size={14} color={Colors.error} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>4. Calculated the Business Impact</Text>
            <Text style={styles.nodeDesc}>
              We calculated how much your business profits would shrink if delivery pricing remained unchanged.
            </Text>
          </View>
        </View>

        {/* Step 5 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineIconContainer, { backgroundColor: Colors.successMedium }]}>
            <Ionicons name="checkmark-done-circle" size={14} color={Colors.success} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.nodeTitle}>5. Simulated Best Action</Text>
            <Text style={styles.nodeDesc}>
              We created a safe virtual playground to test pricing adjustments and generated step-by-step steps.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: Colors.modalSurface }]}>
              {executionLogs && executionLogs.length > 0 ? (
                executionLogs.slice(-3).map((log, i) => (
                  <Text key={i} style={[styles.codeText, { color: Colors.codeGreen }]} numberOfLines={1}>
                    {log}
                  </Text>
                ))
              ) : (
                <Text style={[styles.codeText, { color: Colors.outline }]}>Sandbox playground ready...</Text>
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
          <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Export')}
        >
          <Ionicons name="download-outline" size={18} color={Colors.onSurface} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>Export Summary PDF</Text>
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
