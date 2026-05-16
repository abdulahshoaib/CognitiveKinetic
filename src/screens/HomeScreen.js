import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/layout';

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Cognitive<Text style={styles.titleAccent}>Kinetic</Text></Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Progress</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>You're on a 5-day streak! Keep it up.</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>75%</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Ingestion')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: Colors.danger }]} />
            <Text style={styles.actionText}>Ingest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Insights')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: Colors.teal }]} />
            <Text style={styles.actionText}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('AgentTrace')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: Colors.info }]} />
            <Text style={styles.actionText}>Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Demo')}>
            <View style={[styles.iconPlaceholder, { backgroundColor: Colors.warning }]} />
            <Text style={styles.actionText}>Demo</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.mainCta} onPress={() => navigation?.navigate('Ingestion')}>
          <Text style={styles.mainCtaText}>Start Session</Text>
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
    padding: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
  },
  headerContainer: {
    marginBottom: Spacing['4xl'],
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.extrabold,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  badge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm / 1.5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  badgeText: {
    color: Colors.success,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 4,
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  progressText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing['4xl'],
  },
  actionButton: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: Spacing.lg,
  },
  actionText: {
    color: '#E2E8F0',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  mainCta: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg + 2,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCtaText: {
    color: Colors.background,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
