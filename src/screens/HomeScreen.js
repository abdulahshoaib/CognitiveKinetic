import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/layout';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Agent Command Center</Text>
          <Text style={styles.userEmail}>{user?.displayName || 'Anonymous Session'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Cognitive<Text style={styles.titleAccent}>Kinetic</Text></Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>System Status</Text>
          </View>
          <Text style={styles.cardSubtitle}>Agent is idling. Ready for data ingestion and trace analysis.</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>100%</Text>
              <Text style={styles.metricLabel}>Uptime</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>0ms</Text>
              <Text style={styles.metricLabel}>Latency</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Ingestion')}>
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Ingest Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Insights')}>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('AgentTrace')}>
            <View style={styles.iconContainer}>
              <Ionicons name="git-network-outline" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionText}>Agent Trace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Demo')}>
            <View style={styles.iconContainer}>
              <Ionicons name="play-circle-outline" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>Run Demo</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.mainCta} onPress={() => navigation?.navigate('Ingestion')}>
          <Text style={styles.mainCtaText}>Initialize Pipeline</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.background,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
  },
  userEmail: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  logoutButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  headerContainer: {
    marginBottom: Spacing['3xl'],
    marginTop: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.extrabold,
    letterSpacing: -1,
  },
  titleAccent: {
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl, // 12px per DESIGN.md
    padding: Spacing.xl,
    marginBottom: Spacing['3xl'],
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, // pill shaped
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badgeText: {
    color: Colors.success,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    fontFamily: 'monospace',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.surfaceBorder,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing['3xl'],
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  mainCta: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg, // 8px per DESIGN.md
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  mainCtaText: {
    color: '#FFFFFF', // White text on Primary button
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
});
