import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 1: Content Ingestion
 * - Text input for reports, news, policy updates
 * - PDF and document upload
 * - Web article / URL ingestion
 * - Manual sample input for demos
 * - Input history
 */
export default function IngestionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Content Ingestion</Text>
        <Text style={styles.subtitle}>Upload or paste content for analysis</Text>
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
