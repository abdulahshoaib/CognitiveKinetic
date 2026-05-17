import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAnalysis } from '../context/AnalysisContext';

export default function OutcomeScreen({ navigation }) {
  const { systemState } = useAnalysis();

  // Dynamic status check
  const isOptimized = systemState?.longDistanceSurcharge > 0;
  
  // Operational mock calculations based on surcharge level
  const baseRate = systemState?.baseDeliveryFee || 100;
  const surcharge = systemState?.longDistanceSurcharge || 0;
  const grossRate = baseRate + surcharge;
  const marginImprovement = isOptimized ? '20.0%' : '0.0%';
  const costOffsetIndex = isOptimized ? '94.2%' : '84.0%';
  const customerFriction = isOptimized ? 'Low' : 'Zero';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stage Header */}
        <View style={styles.stageIndicatorRow}>
          <Text style={styles.stageTitle}>Prices Updated → Business Safe → </Text>
          <Text style={styles.stageTitleActive}>Deployment Report</Text>
        </View>

        {/* Deployed Banner */}
        <View style={[styles.bannerCard, { borderColor: isOptimized ? Colors.success : Colors.tertiary }]}>
          <View style={[styles.iconContainer, { backgroundColor: isOptimized ? Colors.successMedium : Colors.warningMuted }]}>
            <Ionicons 
               name={isOptimized ? "cloud-done" : "cloud-offline-outline"} 
              size={36} 
              color={isOptimized ? Colors.success : Colors.tertiary} 
            />
          </View>
          <Text style={styles.bannerTitle}>
            {isOptimized ? 'New Pricing Active' : 'Current Pricing Active'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {isOptimized 
              ? 'A Rs. 20 long-distance surcharge is now live to protect your delivery profits.'
              : 'Your business is running standard baseline pricing. No surcharge is active.'}
          </Text>
        </View>

        {/* Yield Telemetry Grid */}
        <Text style={styles.sectionHeader}>Expected Results</Text>
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Ionicons name="trending-up" size={20} color={isOptimized ? Colors.success : Colors.outline} style={{ marginBottom: 8 }} />
            <Text style={styles.gridLabel}>Profit Improvement</Text>
            <Text style={[styles.gridValue, { color: isOptimized ? Colors.success : Colors.onSurface }]}>+{marginImprovement}</Text>
          </View>
          <View style={styles.gridCard}>
            <Ionicons name="calculator" size={20} color={Colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.gridLabel}>Estimated Delivery Price</Text>
            <Text style={styles.gridValue}>Rs. {grossRate}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <Ionicons name="analytics" size={20} color={Colors.tertiary} style={{ marginBottom: 8 }} />
            <Text style={styles.gridLabel}>Fuel Cost Covered</Text>
            <Text style={styles.gridValue}>{costOffsetIndex}</Text>
          </View>
          <View style={styles.gridCard}>
            <Ionicons name="people" size={20} color={isOptimized ? Colors.error : Colors.success} style={{ marginBottom: 8 }} />
            <Text style={styles.gridLabel}>Customer Impact Risk</Text>
            <Text style={[styles.gridValue, { color: isOptimized ? Colors.error : Colors.success }]}>{customerFriction}</Text>
          </View>
        </View>

        {/* Active Registry Ledger */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Active Delivery Fees</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Base Fee</Text>
              <Text style={styles.statValue}>Rs. {baseRate}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Long Distance Surcharge</Text>
              <Text style={[styles.statValue, isOptimized && { color: Colors.success, fontWeight: '700' }]}>
                Rs. {surcharge}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Peak Hour Fee</Text>
              <Text style={styles.statValue}>Rs. {systemState?.peakHourSurcharge || 15}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.statLabel}>Pricing Status</Text>
              <Text style={[styles.statValue, { fontStyle: 'italic', color: Colors.success }]}>Active & Live</Text>
            </View>
          </View>
        </View>

        {/* Navigations CTA */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={Colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('AgentTrace')}
        >
          <Ionicons name="newspaper-outline" size={18} color={Colors.onSurface} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryButtonText}>See How AI Reached This Decision</Text>
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
  bannerCard: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.shadowSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    color: Colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionHeader: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    padding: 16,
  },
  gridLabel: {
    color: Colors.outline,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gridValue: {
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainer: {
    backgroundColor: Colors.transparent,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  statLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
  },
  statValue: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
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
