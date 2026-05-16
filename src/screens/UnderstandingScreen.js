import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 2: Content Understanding
 * - Extract key facts, entities, numbers, dates, locations, metrics
 * - Detect signals (decline, increase, risk, delay, etc.)
 * - Convert unstructured → structured JSON
 * - Categorize by domain
 */
export default function UnderstandingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Content Understanding</Text>
        <Text style={styles.subtitle}>Extracted facts and structured data</Text>
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
