import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAnalysis } from '../context/AnalysisContext';

export default function ImpactScreen({ navigation }) {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="trending-down" size={48} color={Colors.outline} />
          </View>
          <Text style={styles.emptyTitle}>No Impact Assessment Available</Text>
          <Text style={styles.emptySubtitle}>
            Complete the signal understanding and semantic relevance stage first.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Ingestion')}
          >
            <Text style={styles.emptyButtonText}>Back to Content Ingest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { impact } = analysisResult;

  const getRiskColor = (level) => {
    if (level === 'critical' || level === 'high') return '#ef4444'; // Threat/Red
    if (level === 'medium') return '#F59E0B'; // Risk/Amber
    return '#10b981'; // Growth/Emerald
  };

  const getRiskBg = (level) => {
    if (level === 'critical' || level === 'high') return 'rgba(239, 68, 68, 0.1)';
    if (level === 'medium') return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Ingestion → Insights → </Text>
          <Text style={styles.stageTitleActive}>Impact Analysis</Text>
          <Text style={styles.stageTitle}> → Actions</Text>
        </View>

        {/* 1. Glowing Threat Assessment Console */}
        <View style={[styles.riskCard, { backgroundColor: getRiskBg(impact.riskLevel), borderColor: getRiskColor(impact.riskLevel) }]}>
          <View style={styles.riskHeader}>
            <View>
              <Text style={styles.riskLabel}>Operational Threat Rating</Text>
              <Text style={styles.riskSub}>Based on saved business risk-sensitivity limits</Text>
            </View>
            <View style={[styles.riskBadge, { borderColor: getRiskColor(impact.riskLevel) }]}>
              <Text style={[styles.riskBadgeText, { color: getRiskColor(impact.riskLevel) }]}>
                {impact.riskLevel ? impact.riskLevel.toUpperCase() : 'BALANCED'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.riskExplanation}>{impact.explanation}</Text>
        </View>

        {/* 2. Short & Medium Term Timeline Block */}
        <Text style={styles.sectionHeader}>Operational Consequence Forecast</Text>
        
        <View style={styles.timelineContainer}>
          {/* Node 1: Short Term */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="time" size={14} color="#020617" />
              </View>
              <View style={styles.timelineConnector} />
            </View>
            
            <View style={styles.timelineContentCard}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.timelinePeriod}>IMMEDIATE TERM</Text>
                <Text style={styles.timelineRange}>1 – 30 Days</Text>
              </View>
              <Text style={styles.timelineBodyText}>{impact.shortTerm}</Text>
            </View>
          </View>

          {/* Node 2: Medium Term */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="calendar" size={14} color="#020617" />
              </View>
            </View>
            
            <View style={styles.timelineContentCard}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.timelinePeriod}>TACTICAL TRANSITION</Text>
                <Text style={styles.timelineRange}>30 – 90 Days</Text>
              </View>
              <Text style={styles.timelineBodyText}>{impact.mediumTerm}</Text>
            </View>
          </View>
        </View>

        {/* 3. Affected Vulnerabilities Matrix */}
        <Text style={styles.sectionHeader}>Impacted Operating Vectors</Text>
        
        <View style={styles.vectorsCard}>
          <View style={styles.vectorRow}>
            <Ionicons name="cash-outline" size={18} color="#F59E0B" style={styles.vectorIcon} />
            <View style={styles.vectorInfo}>
              <Text style={styles.vectorLabel}>Resource Outflow</Text>
              <Text style={styles.vectorVal}>Raw resource baseline cost increase detected (+12% fuel coefficient)</Text>
            </View>
          </View>
          
          <View style={styles.vectorDivider} />
          
          <View style={styles.vectorRow}>
            <Ionicons name="people-outline" size={18} color="#3B82F6" style={styles.vectorIcon} />
            <View style={styles.vectorInfo}>
              <Text style={styles.vectorLabel}>B2B Contract Retention</Text>
              <Text style={styles.vectorVal}>Volume-based billing systems require alignment to prevent margin leak</Text>
            </View>
          </View>
          
          <View style={styles.vectorDivider} />
          
          <View style={styles.vectorRow}>
            <Ionicons name="speedometer-outline" size={18} color="#10b981" style={styles.vectorIcon} />
            <View style={styles.vectorInfo}>
              <Text style={styles.vectorLabel}>Fleet Efficiency</Text>
              <Text style={styles.vectorVal}>Inter-city haulage networks and dispatch buffers face adjustment pressures</Text>
            </View>
          </View>
        </View>

        {/* Guided CTA Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('Actions')}
        >
          <Text style={styles.nextButtonText}>View Strategy Recommendations</Text>
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
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
  riskCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riskLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  riskSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  riskExplanation: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineConnector: {
    position: 'absolute',
    top: 24,
    width: 2,
    bottom: -20,
    backgroundColor: '#1E293B',
    zIndex: 1,
  },
  timelineContentCard: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#0F172A', // Navy L1 Surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 14,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelinePeriod: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineRange: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },
  timelineBodyText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  vectorsCard: {
    backgroundColor: '#0F172A', // Navy L1 Surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  vectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  vectorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  vectorInfo: {
    flex: 1,
  },
  vectorLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  vectorVal: {
    color: '#c6c6cd',
    fontSize: 12,
    lineHeight: 16,
  },
  vectorDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 8,
  },
  nextButton: {
    backgroundColor: '#3B82F6', // Solid Electric Blue
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
