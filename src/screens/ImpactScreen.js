import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    if (level === 'critical' || level === 'high') return '#ffb4ab'; // error
    if (level === 'medium') return '#dec29a'; // tertiary (Warning)
    return '#bec6e0'; // primary (Safe)
  };

  const getRiskBg = (level) => {
    if (level === 'critical' || level === 'high') return 'rgba(255, 180, 171, 0.1)';
    if (level === 'medium') return 'rgba(222, 194, 154, 0.1)';
    return 'rgba(190, 198, 224, 0.1)';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Impact Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Projected operational consequences and timeline shifts based on insights.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Main Impact Card with glowing border */}
        <View style={styles.impactMainCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-network-outline" size={20} color={'#ffb4ab'} style={styles.titleIcon} />
            <Text style={styles.cardTitle}>Operational Impact</Text>
          </View>

          <View style={styles.gridContainer}>
            {/* Impact 1: Margin/Resource */}
            <View style={styles.gridItem}>
              <View style={styles.gridItemHeader}>
                <Ionicons name="arrow-down-circle" size={20} color="#ffb4ab" style={styles.gridIcon} />
                <Text style={styles.gridItemTitle}>Resource Drain</Text>
              </View>
              <Text style={styles.gridItemText}>
                {impact.explanation || "Projected resource constraints if current predictive models hold without intervention."}
              </Text>
            </View>

            {/* Impact 2: Timeline */}
            <View style={styles.gridItem}>
              <View style={styles.gridItemHeader}>
                <Ionicons name="time" size={20} color="#dec29a" style={styles.gridIcon} />
                <Text style={styles.gridItemTitle}>Timeline Shift</Text>
              </View>
              <Text style={styles.gridItemText}>
                {impact.mediumTerm || "Current operating timeline may face delays without immediate tactical transitions."}
              </Text>
            </View>

            {/* Impact 3: Action Required */}
            <View style={styles.gridItemAction}>
              <View style={styles.gridItemHeader}>
                <Ionicons name="alert-circle" size={20} color="#bec6e0" style={styles.gridIcon} />
                <Text style={styles.gridItemTitlePrimary}>Action Required</Text>
              </View>
              <Text style={styles.gridItemText}>
                {impact.shortTerm || "Approve mitigation workflows to limit exposure."}
              </Text>
              
              <TouchableOpacity
                style={styles.initiateButton}
                onPress={() => navigation.navigate('Actions')}
              >
                <Text style={styles.initiateButtonText}>INITIATE WORKFLOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131315', // surface-dim
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffb4ab', // error (red tint for impact)
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#c6c6cd',
    fontSize: 16,
    lineHeight: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  impactMainCard: {
    backgroundColor: '#1f1f21', // surface-container
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.2)', // error with opacity
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#45464d',
  },
  titleIcon: {
    marginRight: 8,
  },
  cardTitle: {
    color: '#e4e2e4',
    fontSize: 24,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  gridItem: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#45464d',
  },
  gridItemAction: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(190, 198, 224, 0.3)', // primary subtle border
  },
  gridItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridIcon: {
    marginRight: 8,
  },
  gridItemTitle: {
    color: '#e4e2e4',
    fontSize: 18,
    fontWeight: '600',
  },
  gridItemTitlePrimary: {
    color: '#bec6e0', // primary
    fontSize: 18,
    fontWeight: '600',
  },
  gridItemText: {
    color: '#c6c6cd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  initiateButton: {
    backgroundColor: '#bec6e0', // primary
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  initiateButtonText: {
    color: '#283044', // on-primary
    fontSize: 13,
    fontWeight: '500', // mono-label mock
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1f1f21', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#45464d', 
  },
  emptyTitle: {
    color: '#e4e2e4',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#c6c6cd',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#bec6e0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#283044',
    fontSize: 14,
    fontWeight: '600',
  },
});
