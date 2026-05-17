import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';

export default function AgentTraceScreen({ navigation }) {
  const { analysisResult, executionLogs } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={[styles.stageTitle, { color: c.textSecondary }]}>Dashboard → News Report → </Text>
          <Text style={[styles.stageTitleActive, { color: c.accent }]}>AI Decision Process</Text>
        </View>

        {/* Cognitive Block Diagram */}
        <View style={[styles.traceHeaderCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Feather name="git-branch" size={24} color={c.accent} style={{ marginBottom: 8 }} />
          <Text style={[styles.traceHeaderTitle, { color: c.textPrimary }]}>AI Reasoning Chain</Text>
          <Text style={[styles.traceHeaderSubtitle, { color: c.textSecondary }]}>
            Below is the structured step-by-step reasoning the agent followed to analyze the incoming signals and recommend business actions.
          </Text>
        </View>

        {/* Dynamic Chronological Timeline */}
        <Text style={[styles.sectionHeader, { color: c.textPrimary }]}>Structured Workflow Execution</Text>

        {/* Step 1 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineLine, { backgroundColor: c.surfaceBorder }]} />
          <View style={[styles.timelineIconContainer, { backgroundColor: c.primarySubtle, borderColor: c.primary }]}>
            <Feather name="briefcase" size={14} color={c.primary} />
          </View>
          <View style={[styles.timelineContent, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>1. Loaded Profile Settings</Text>
            <Text style={[styles.nodeDesc, { color: c.textSecondary }]}>
              Retrieved active context configuration to calibrate the analysis filters.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
              <Text style={[styles.codeText, { color: c.textSecondary }]}>{"{\n  domain: \"delivery logistics\",\n  locations: [\"Lahore\", \"Karachi\"],\n  sensitivity: \"aggressive\"\n}"}</Text>
            </View>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineLine, { backgroundColor: c.surfaceBorder }]} />
          <View style={[styles.timelineIconContainer, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
            <Feather name="file-text" size={14} color={c.accent} />
          </View>
          <View style={[styles.timelineContent, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>2. Extracted Signal Facts</Text>
            <Text style={[styles.nodeDesc, { color: c.textSecondary }]}>
              Isolated relevant concrete items from ingested manual or feed source logs.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
              <Text style={[styles.codeText, { color: c.textSecondary }]}>
                {analysisResult?.ingestionResult 
                  ? `Signals: ${analysisResult.ingestionResult.signals?.map(s => s.title).join(', ')}`
                  : "Signal detected: Fuel price escalation +12% effective immediately."}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineLine, { backgroundColor: c.surfaceBorder }]} />
          <View style={[styles.timelineIconContainer, { backgroundColor: c.successSoft, borderColor: c.success }]}>
            <Feather name="shield" size={14} color={c.success} />
          </View>
          <View style={[styles.timelineContent, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>3. Profile Relevance Check</Text>
            <Text style={[styles.nodeDesc, { color: c.textSecondary }]}>
              Determined semantic and contextual overlap relative to business priorities.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
              <Text style={[styles.codeText, { color: c.textSecondary }]}>
                {`Relevance score: Very High\nMatch Index: 92.4%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineLine, { backgroundColor: c.surfaceBorder }]} />
          <View style={[styles.timelineIconContainer, { backgroundColor: c.errorSoft, borderColor: c.error }]}>
            <Feather name="activity" size={14} color={c.error} />
          </View>
          <View style={[styles.timelineContent, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>4. Impact Assessment</Text>
            <Text style={[styles.nodeDesc, { color: c.textSecondary }]}>
              Calculated margins pressure and risk vectors if default operating parameters persist.
            </Text>
          </View>
        </View>

        {/* Step 5 */}
        <View style={styles.timelineNode}>
          <View style={[styles.timelineIconContainer, { backgroundColor: c.successSoft, borderColor: c.success }]}>
            <Feather name="check-circle" size={14} color={c.success} />
          </View>
          <View style={[styles.timelineContent, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.nodeTitle, { color: c.textPrimary }]}>5. Simulated Mitigation Strategy</Text>
            <Text style={[styles.nodeDesc, { color: c.textSecondary }]}>
              Generated isolated workspace variables to test pricing changes safely before deployment.
            </Text>
            <View style={[styles.codeSnippet, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
              {executionLogs && executionLogs.length > 0 ? (
                executionLogs.slice(-3).map((log, i) => (
                  <Text key={i} style={[styles.codeText, { color: c.success }]} numberOfLines={1}>
                    {log}
                  </Text>
                ))
              ) : (
                <Text style={[styles.codeText, { color: c.textSecondary }]}>Sandbox execution traces ready...</Text>
              )}
            </View>
          </View>
        </View>

        {/* Navigation CTA */}
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: c.accent }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Feather name="home" size={20} color={c.white} style={{ marginRight: 8 }} />
          <Text style={[styles.primaryButtonText, { color: c.white }]}>Return to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, { backgroundColor: c.surfaceContainerHigh, borderColor: c.surfaceBorder }]}
          onPress={() => navigation.navigate('Export')}
        >
          <Feather name="download" size={18} color={c.textPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>Export Summary PDF</Text>
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
  traceHeaderCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  traceHeaderTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 6,
  },
  traceHeaderSubtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
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
    zIndex: 1,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginRight: 14,
  },
  timelineContent: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  nodeTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  nodeDesc: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
    marginBottom: 8,
  },
  codeSnippet: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    lineHeight: 14,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
});
