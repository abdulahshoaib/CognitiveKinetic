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
import { useAnalysis } from '../context/AnalysisContext';

export default function ActionsScreen({ navigation }) {
  const { analysisResult, setSelectedItem } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash-off" size={48} color="#909097" />
          </View>
          <Text style={styles.emptyTitle}>No Recommendations Ready</Text>
          <Text style={styles.emptySubtitle}>
            Complete the operational impact analysis stage to see strategic recommendations.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Ingestion')}
          >
            <Text style={styles.emptyButtonText}>Back to Ingestion Feed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { recommendedActions } = analysisResult;

  const getUrgencyColor = (urgency) => {
    if (urgency === 'critical' || urgency === 'high') return '#ef4444'; // Threat/Red
    if (urgency === 'medium') return '#F59E0B'; // Risk/Amber
    return '#10b981'; // Growth/Emerald
  };

  const getUrgencyBg = (urgency) => {
    if (urgency === 'critical' || urgency === 'high') return 'rgba(239, 68, 68, 0.1)';
    if (urgency === 'medium') return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  const handleSelectSimulation = (action) => {
    // Navigate directly to Simulation Screen and pass this action as a param
    navigation.navigate('Simulation', { action });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Ingestion → Insights → Impact → </Text>
          <Text style={styles.stageTitleActive}>Actions Recommendations</Text>
        </View>

        <Text style={styles.sectionHeader}>Ranked Decisions Portfolio</Text>

        {recommendedActions && recommendedActions.length > 0 ? (
          recommendedActions.map((action) => {
            const isSimulatable = action.simulationSupported;
            return (
              <View key={action.id} style={styles.actionCard}>
                
                {/* Card Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerInfo}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyBg(action.urgency), borderColor: getUrgencyColor(action.urgency) }]}>
                        <Text style={[styles.urgencyBadgeText, { color: getUrgencyColor(action.urgency) }]}>
                          {action.urgency.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.systemTag}>
                        <Ionicons name="hardware-chip-outline" size={10} color="#94a3b8" style={{ marginRight: 4 }} />
                        <Text style={styles.systemTagText}>{action.targetSystem}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Body Details */}
                <Text style={styles.actionDescription}>{action.description}</Text>

                <View style={styles.rationaleContainer}>
                  <Text style={styles.rationaleLabel}>STRATEGIC RATIONALE</Text>
                  <Text style={styles.rationaleText}>{action.rationale}</Text>
                </View>

                <View style={styles.divider} />

                {/* Confidence Metrics */}
                <View style={styles.metricsFooter}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>CONFIDENCE COEFFICIENT</Text>
                    <Text style={styles.metricVal}>{action.confidence}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>INTEGRATION ENGINE</Text>
                    <Text style={styles.metricVal}>{isSimulatable ? 'Autonomous API' : 'Manual Audit'}</Text>
                  </View>
                </View>

                {/* Simulate vs Offline CTA buttons */}
                {isSimulatable ? (
                  <TouchableOpacity
                    style={styles.simulateButton}
                    onPress={() => handleSelectSimulation(action)}
                  >
                    <Ionicons name="play-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.simulateButtonText}>Run Operational Simulation</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.offlineIndicator}>
                    <Ionicons name="information-circle-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                    <Text style={styles.offlineText}>Requires Manual Administrative Action</Text>
                  </View>
                )}

              </View>
            );
          })
        ) : (
          <View style={styles.emptySubCard}>
            <Text style={styles.emptySubCardText}>No actionable strategy adjustments compiled.</Text>
          </View>
        )}
        
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
    marginBottom: 20,
  },
  stageTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  stageTitleActive: {
    color: '#3B82F6', // Active Pulse Blue
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#0F172A', // Navy L1 Surface
    borderWidth: 1,
    borderColor: '#1E293B', // Slate Border
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  urgencyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  systemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617', // L0 Deep Navy
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  systemTagText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
  },
  actionDescription: {
    color: '#c6c6cd',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  rationaleContainer: {
    backgroundColor: '#020617', // L0 Deep Navy
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6', // Electric Blue Bar
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  rationaleLabel: {
    color: '#3B82F6',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rationaleText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    borderColor: '#1E293B',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  metricsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  simulateButton: {
    backgroundColor: '#3B82F6', // Electric Blue
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  simulateButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  offlineText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
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
});
