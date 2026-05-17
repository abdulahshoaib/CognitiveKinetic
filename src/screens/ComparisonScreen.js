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

export default function ComparisonScreen({ navigation }) {
  const { simulationResult, clearAnalysis } = useAnalysis();

  if (!simulationResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="git-compare" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>No Simulated Results Found</Text>
          <Text style={styles.emptySubtitle}>
            Run an operational simulation first to review system changes.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Actions')}
          >
            <Text style={styles.emptyButtonText}>View Recommendations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { beforeState, afterState, actionTitle } = simulationResult;

  // Calculate totals
  const totalBefore = beforeState.baseDeliveryFee + beforeState.longDistanceSurcharge + beforeState.peakHourSurcharge;
  const totalAfter = afterState.baseDeliveryFee + afterState.longDistanceSurcharge + afterState.peakHourSurcharge;
  const variance = totalAfter - totalBefore;

  const handleApproveAndDeploy = () => {
    // Clear active analysis state to reset the pipeline context but preserve modified systemState in central context!
    clearAnalysis();
    navigation.navigate('Home', { showToast: true, toastMsg: 'New pricing configuration deployed live!' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Ingestion → Insights → Impact → Actions → Simulation → </Text>
          <Text style={styles.stageTitleActive}>Before vs After</Text>
        </View>

        {/* Deployment Header */}
        <View style={styles.diffHeaderCard}>
          <Text style={styles.metaLabel}>DEPLOYMENT CHANGE DETECTED</Text>
          <Text style={styles.diffTitle}>{actionTitle}</Text>
          <View style={styles.changeOverviewBadge}>
            <Ionicons name="trending-up" size={14} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={styles.changeOverviewText}>Defends operational yield by +Rs. {variance}</Text>
          </View>
        </View>

        {/* Side-by-Side Comparison Container */}
        <View style={styles.sideBySideRow}>
          
          {/* BEFORE STATE */}
          <View style={styles.stateHalf}>
            <View style={[styles.stateHeader, { backgroundColor: '#020617', borderColor: '#1E293B' }]}>
              <Text style={styles.stateHeaderText}>BEFORE</Text>
            </View>
            <View style={styles.stateBody}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Base Fee</Text>
                <Text style={styles.metricVal}>Rs. {beforeState.baseDeliveryFee}</Text>
              </View>
              <View style={styles.metricDivider} />
              
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Long Dist.</Text>
                <Text style={styles.metricVal}>Rs. {beforeState.longDistanceSurcharge}</Text>
              </View>
              <View style={styles.metricDivider} />
              
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Peak Hour</Text>
                <Text style={styles.metricVal}>Rs. {beforeState.peakHourSurcharge}</Text>
              </View>
              
              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel}>TOTAL COST</Text>
                <Text style={styles.totalVal}>Rs. {totalBefore}</Text>
              </View>
            </View>
          </View>

          {/* TRANSFER CONNECTOR ARROW */}
          <View style={styles.connectorCol}>
            <Ionicons name="arrow-forward" size={18} color="#94a3b8" />
          </View>

          {/* AFTER STATE */}
          <View style={styles.stateHalf}>
            <View style={[styles.stateHeader, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }]}>
              <Text style={[styles.stateHeaderText, { color: '#10b981' }]}>OPTIMIZED</Text>
            </View>
            <View style={styles.stateBody}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Base Fee</Text>
                <Text style={styles.metricVal}>Rs. {afterState.baseDeliveryFee}</Text>
              </View>
              <View style={styles.metricDivider} />
              
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Long Dist.</Text>
                <Text style={[
                  styles.metricVal, 
                  afterState.longDistanceSurcharge !== beforeState.longDistanceSurcharge && { color: '#10b981', fontWeight: '700' }
                ]}>
                  Rs. {afterState.longDistanceSurcharge}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Peak Hour</Text>
                <Text style={[
                  styles.metricVal, 
                  afterState.peakHourSurcharge !== beforeState.peakHourSurcharge && { color: '#10b981', fontWeight: '700' }
                ]}>
                  Rs. {afterState.peakHourSurcharge}
                </Text>
              </View>
              
              <View style={[styles.totalBlock, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <Text style={styles.totalLabel}>TOTAL COST</Text>
                <Text style={[styles.totalVal, { color: '#10b981' }]}>Rs. {totalAfter}</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Change Verification Rationale */}
        <View style={styles.rationaleCard}>
          <Text style={styles.rationaleTitle}>Integration Validation Report</Text>
          <Text style={styles.rationaleBody}>
            The dynamic ruleset modification matches the targeting criteria. Billing templates have been parsed and configured to apply this surcharge ruleset across active operations. Margin models indicate defensive yield goals remain preserved.
          </Text>
        </View>

        {/* Deploy Live CTA */}
        <TouchableOpacity
          style={styles.deployButton}
          onPress={handleApproveAndDeploy}
        >
          <Ionicons name="cloud-done" size={20} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.deployButtonText}>Approve & Deploy Rules Live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.cancelButtonText}>Discard Sandbox Changes</Text>
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
  diffHeaderCard: {
    backgroundColor: '#0F172A', // Navy L1 Surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  diffTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  changeOverviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  changeOverviewText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  sideBySideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stateHalf: {
    flex: 1,
    backgroundColor: '#0F172A', // Navy L1 Surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stateHeader: {
    height: 32,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateHeaderText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stateBody: {
    padding: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  totalBlock: {
    marginTop: 12,
    backgroundColor: '#020617', // Navy L0 deep canvas
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  totalVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  connectorCol: {
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rationaleCard: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  rationaleTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  rationaleBody: {
    color: '#c6c6cd',
    fontSize: 12,
    lineHeight: 16,
  },
  deployButton: {
    backgroundColor: '#10b981', // Growth Emerald/Green
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  deployButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#ef4444', // Threat Red
    fontSize: 13,
    fontWeight: '600',
  },
});
