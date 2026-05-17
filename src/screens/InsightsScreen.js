import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAnalysis } from '../context/AnalysisContext';

export default function InsightsScreen({ navigation }) {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="analytics" size={48} color={Colors.outline} />
          </View>
          <Text style={styles.emptyTitle}>No Active Analysis Session</Text>
          <Text style={styles.emptySubtitle}>
            Please select or ingest new content from the Content Feed to run the autonomous pipeline.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Ingestion')}
          >
            <Text style={styles.emptyButtonText}>Go to Content Input</Text>
            <Ionicons name="add" size={18} color={Colors.onPrimary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { relevanceScore, isRelevant, signals, insights } = analysisResult;

  const getSeverityColor = (severity) => {
    if (severity === 'high' || severity === 'critical') return '#ef4444'; // Threat/Red
    if (severity === 'medium') return '#F59E0B'; // Risk/Amber
    return '#10b981'; // Growth/Emerald
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high' || priority === 'critical') return 'alert-circle';
    if (priority === 'medium') return 'warning';
    return 'information-circle';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Ingestion → </Text>
          <Text style={styles.stageTitleActive}>Insights</Text>
          <Text style={styles.stageTitle}> → Impact → Action</Text>
        </View>

        {/* 1. Relevance Gauge Block */}
        <View style={styles.relevanceCard}>
          <View style={styles.relevanceHeader}>
            <View>
              <Text style={styles.relevanceLabel}>Semantic Profile Alignment</Text>
              <Text style={styles.relevanceSub}>Strength of match with active profile parameters</Text>
            </View>
            <View style={[
              styles.scoreBadge, 
              { backgroundColor: isRelevant ? 'rgba(16, 185, 129, 0.1)' : '#020617' }
            ]}>
              <Text style={[styles.scoreText, { color: isRelevant ? '#10b981' : '#94a3b8' }]}>
                {relevanceScore}%
              </Text>
            </View>
          </View>

          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeTrack}>
              <View style={[
                styles.gaugeFill, 
                { 
                  width: `${relevanceScore}%`,
                  backgroundColor: relevanceScore > 70 ? '#10b981' : relevanceScore > 40 ? '#F59E0B' : '#94a3b8'
                }
              ]} />
            </View>
            <View style={styles.gaugeMarkers}>
              <Text style={styles.gaugeMarkerText}>Low</Text>
              <Text style={styles.gaugeMarkerText}>Balanced</Text>
              <Text style={styles.gaugeMarkerText}>Critical Alignment</Text>
            </View>
          </View>
          
          <View style={styles.relevanceSummaryRow}>
            <Ionicons 
              name={isRelevant ? "checkmark-circle-outline" : "close-circle-outline"} 
              size={18} 
              color={isRelevant ? '#10b981' : '#94a3b8'} 
            />
            <Text style={[styles.relevanceStatusText, { color: isRelevant ? '#ffffff' : '#94a3b8' }]}>
              {isRelevant 
                ? 'Relevance thresholds exceeded. Insights generated successfully.' 
                : 'Insufficient profile match. Context-to-action bypass triggered.'
              }
            </Text>
          </View>
        </View>

        {/* 2. Extracted Threat Signals */}
        <Text style={styles.sectionHeader}>Extracted Threat Signals</Text>
        {signals && signals.length > 0 ? (
          <View style={styles.signalsContainer}>
            {signals.map((sig) => (
              <View key={sig.id} style={styles.signalCard}>
                <View style={styles.signalHeader}>
                  <View style={styles.signalLabelContainer}>
                    <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(sig.severity) }]} />
                    <Text style={styles.signalLabel}>{sig.label}</Text>
                  </View>
                  <Text style={[styles.signalMetric, { color: getSeverityColor(sig.severity) }]}>
                    {sig.metric}
                  </Text>
                </View>
                <Text style={styles.signalEvidence}>{sig.evidence}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySubCard}>
            <Text style={styles.emptySubCardText}>No metric signals parsed from input.</Text>
          </View>
        )}

        {/* 3. Operational Insights */}
        <Text style={styles.sectionHeader}>Ranked Operational Insights</Text>
        {insights && insights.length > 0 ? (
          insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleContainer}>
                  <Ionicons 
                    name={getPriorityIcon(insight.priority)} 
                    size={20} 
                    color={getSeverityColor(insight.priority)} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <View style={[
                  styles.priorityTag, 
                  { borderColor: getSeverityColor(insight.priority) }
                ]}>
                  <Text style={[styles.priorityTagText, { color: getSeverityColor(insight.priority) }]}>
                    {insight.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.insightDescription}>{insight.description}</Text>

              <View style={styles.insightDivider} />

              <View style={styles.insightFooter}>
                <View style={styles.footerField}>
                  <Text style={styles.footerLabel}>AFFECTED DEP</Text>
                  <Text style={styles.footerVal}>{insight.affectedArea}</Text>
                </View>
                <View style={styles.footerField}>
                  <Text style={styles.footerLabel}>PRIMARY EVIDENCE</Text>
                  <Text style={styles.footerVal} numberOfLines={1}>{insight.evidence}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptySubCard}>
            <Text style={styles.emptySubCardText}>No priorities generated.</Text>
          </View>
        )}

        {/* Action Button to Next Step */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('Impact')}
        >
          <Text style={styles.nextButtonText}>Model Operational Impacts</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Base canvas L0
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F172A', // Navy L1 surface
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B', // Slate border
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6', // Solid Electric Blue
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stageIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stageTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  stageTitleActive: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  relevanceCard: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  relevanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  relevanceLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  relevanceSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  gaugeContainer: {
    marginBottom: 16,
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: '#020617', // Deep Navy L0 track
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeMarkerText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  relevanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617', // L0 Deep Navy
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  relevanceStatusText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  signalsContainer: {
    marginBottom: 16,
  },
  signalCard: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  signalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  signalLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  signalMetric: {
    fontSize: 12,
    fontWeight: '700',
  },
  signalEvidence: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  emptySubCard: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySubCardText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  insightCard: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  insightTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  insightDescription: {
    color: '#c6c6cd',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  insightDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerField: {
    flex: 1,
  },
  footerLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  footerVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#3B82F6', // Solid Electric Blue
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
