import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAnalysis } from '../context/AnalysisContext';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import ActionCard from '../components/common/ActionCard';

export default function ActionsScreen() {
  const navigation = useNavigation();
  const { analysisResult, executeSimulation } = useAnalysis();

  const handleSimulate = async (action) => {
    // Start simulation then navigate to result screen
    executeSimulation(action);
    navigation.navigate('SimulationResult');
  };

  const actions = analysisResult?.recommendedActions || [];

  if (!analysisResult) {
    return (
      <Screen>
        <EmptyState 
          icon="flash-outline"
          title="No Actions Available"
          description="Analyze content first to generate actionable recommendations."
          primaryAction={() => navigation.navigate('IngestionTab')}
          primaryActionTitle="Go to New Content"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={true}>
      <SectionHeader 
        title="Recommended Actions" 
        subtitle="Agent-generated responses based on impact analysis."
      />

      <View style={styles.listContainer}>
        {actions.length === 0 ? (
          <EmptyState 
            icon="checkmark-circle-outline"
            title="All Clear"
            description="No immediate actions required based on the latest report."
          />
        ) : (
          actions.map(action => (
            <ActionCard 
              key={action.id} 
              action={action} 
              onSimulate={handleSimulate} 
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
