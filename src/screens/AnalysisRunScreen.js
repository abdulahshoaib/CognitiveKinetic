import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import StepProgress from '../components/common/StepProgress';
import AgentLogList from '../components/common/AgentLogList';

export default function AnalysisRunScreen() {
  const navigation = useNavigation();
  const { currentStage, isAnalyzing, executionLogs } = useAnalysis();

  const isCompleted = currentStage === 'completed';

  const handleFinish = () => {
    navigation.navigate('ImpactReport');
  };

  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Pipeline</Text>
        <Text style={styles.subtitle}>
          {isCompleted ? 'Analysis complete.' : 'Agent is actively running...'}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <StepProgress currentStage={currentStage} />
      </View>

      <View style={styles.logsSection}>
        <AgentLogList logs={executionLogs} limit={10} />
      </View>

      <View style={styles.actionsContainer}>
        {isCompleted ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
            <Text style={styles.primaryBtnText}>View Report</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.processingBtn}>
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => navigation.navigate('AgentTrace')}
        >
          <Text style={styles.secondaryBtnText}>View Full Trace</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 24,
  },
  logsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
  processingBtn: {
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  processingText: {
    color: Colors.textSecondary,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
});
