import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 3: Insight Extraction
 * - Meaningful insights (not summaries)
 * - Trends, risks, opportunities, anomalies
 * - Ranked by severity, urgency, business impact
 */
export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Key findings ranked by impact</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center' },
});
