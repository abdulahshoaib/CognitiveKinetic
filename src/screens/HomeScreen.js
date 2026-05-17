import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/profileService';
import { useAnalysis } from '../context/AnalysisContext';
import { Ionicons } from '@expo/vector-icons';
import { FontSizes, FontWeights } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/layout';

// Import Reusable Design System Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Header from '../components/common/Header';
import ProgressBar from '../components/common/ProgressBar';

export default function HomeScreen({ navigation, route }) {
  const { user, logout } = useAuth();
  const { systemState, executionLogs, analysisResult } = useAnalysis();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const toastFade = useRef(new Animated.Value(0)).current;
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const checkProfile = async () => {
        if (!user) return;
        setIsLoadingProfile(true);
        try {
          const loadedProfile = await getProfile(user.uid);
          if (!loadedProfile) {
            navigation.replace('Onboarding');
          } else {
            setProfile(loadedProfile);
          }
        } catch (error) {
          console.warn('Firestore fetch failed (likely missing rules). Using fallback demo profile:', error);
          // Resilient fallback for demo/testing when Firestore rules are not yet deployed
          const demoProfile = {
            businessName: 'Apex Logistics Inc.',
            industry: 'Delivery & Logistics',
            locations: 'Lahore, Karachi, Islamabad',
            customers: 'Local Retailers & B2C E-commerce',
            goals: 'Optimize delivery margins, mitigate fuel price fluctuations, and decrease customer churn.',
            concerns: 'Fuel cost volatility and high base rates',
            risks: 'Compressing operating margins on long-distance routes',
            riskSensitivity: 'balanced'
          };
          setProfile(demoProfile);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      checkProfile();
    }, [user, navigation])
  );

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

  // Listen for navigation triggers from the comparison deployment screen
  useEffect(() => {
    if (route.params?.showToast) {
      setToastMsg(route.params.toastMsg || 'Policy adjustments deployed live!');
      
      // Animate slide-in & fade-in
      Animated.sequence([
        Animated.timing(toastFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(3500),
        Animated.timing(toastFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        setToastMsg(null);
        // Clear params to avoid double trigger on focus shifts
        navigation.setParams({ showToast: false, toastMsg: undefined });
      });
    }
  }, [route.params]);

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
      {isLoadingProfile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastFade }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="hardware-chip" size={16} color="#3B82F6" />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerTitle}>Cognitive Kinetic</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Header */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Header
            title="Command Center"
            subtitle="System status and recent analysis overview"
            rightComponent={
              <Button
                label="New Analysis"
                icon="add-circle"
                variant="primary"
                onPress={() => navigation.navigate('Ingestion')}
              />
            }
          />
        </Animated.View>

        {/* System Threat Vector */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="pulse" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>System Threat Vector</Text>
              </View>
              <Badge label="Live Update" variant="active" />
            </View>
            
            <View style={styles.vizContainer}>
              <View style={styles.vizRow}>
                <Text style={styles.vizLabel}>Ingestion Rate</Text>
                <Badge label="Nominal" variant="success" />
              </View>
              <View style={styles.progressBarWrapper}>
                <ProgressBar progress={75} showLabel={false} />
              </View>
              
              <View style={[styles.vizRow, { marginTop: 16 }]}>
                <Text style={styles.vizLabel}>Anomaly Detection</Text>
                <Badge label="Elevated" variant="risk" />
              </View>
              <View style={styles.progressBarWrapper}>
                <ProgressBar progress={50} showLabel={false} />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Profile Summary */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="business" size={24} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName} numberOfLines={1}>{profile?.businessName || 'Business Context'}</Text>
                <View style={styles.statusRow}>
                  <Badge label="Active Profile (Reused)" variant="success" />
                </View>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Domain / Sector</Text>
                <Text style={styles.statValue} numberOfLines={1}>{profile?.industry || 'Unconfigured'}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Jurisdictions</Text>
                <Text style={styles.statValue} numberOfLines={1}>{profile?.locations || 'Unconfigured'}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Risk Threshold</Text>
                <Text style={[styles.statValue, { 
                  color: profile?.riskSensitivity === 'aggressive' ? '#ef4444' 
                       : profile?.riskSensitivity === 'conservative' ? '#10b981' 
                       : '#f59e0b',
                  textTransform: 'capitalize' 
                }]}>
                  {profile?.riskSensitivity || 'Balanced'}
                </Text>
              </View>
              <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.statLabel}>Key Concerns</Text>
                <Text style={styles.statValue} numberOfLines={1}>{profile?.concerns || 'Unconfigured'}</Text>
              </View>
            </View>
            
            <Button
              label="Update Saved Profile"
              variant="secondary"
              icon="settings-outline"
              onPress={() => navigation.navigate('Onboarding')}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Animated.View>

        {/* Active Ruleset & Surcharges */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface" active={systemState?.longDistanceSurcharge > 0}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="git-network" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Live Operational Rules</Text>
              </View>
              <Badge 
                label={systemState?.longDistanceSurcharge > 0 ? 'Optimized Surcharge' : 'Baseline Active'} 
                variant={systemState?.longDistanceSurcharge > 0 ? 'success' : 'neutral'} 
              />
            </View>
            
            <View style={[styles.statsContainer, { marginTop: 16, marginBottom: 0 }]}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Base Delivery Fee</Text>
                <Text style={styles.statValue}>Rs. {systemState?.baseDeliveryFee || 100}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Long-Distance Surcharge</Text>
                <Text style={[
                  styles.statValue, 
                  { 
                    color: systemState?.longDistanceSurcharge > 0 ? '#10b981' : '#ffffff', 
                    fontWeight: systemState?.longDistanceSurcharge > 0 ? '700' : '400' 
                  }
                ]}>
                  Rs. {systemState?.longDistanceSurcharge || 0} {systemState?.longDistanceSurcharge > 0 ? '(+Rs. 20 Optimized Surcharge)' : ''}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Peak-Hour Surcharge</Text>
                <Text style={styles.statValue}>Rs. {systemState?.peakHourSurcharge || 15}</Text>
              </View>
              <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.statLabel}>Last System Sync</Text>
                <Text style={[styles.statValue, { fontStyle: 'italic', fontSize: 11, color: '#64748b' }]}>{systemState?.lastUpdate || 'Synced'}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Execution Trace */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="glass">
            <View style={[styles.cardTitleRow, { marginBottom: 16 }]}>
              <Ionicons name="time" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Execution Trace</Text>
            </View>
            
            <View style={styles.traceContainer}>
              {executionLogs && executionLogs.length > 0 ? (
                executionLogs.slice(-4).reverse().map((log, index) => {
                  const match = log.match(/^\[(.*?)\]\s*(.*)$/);
                  const time = match ? match[1] : 'LIVE';
                  const text = match ? match[2] : log;
                  
                  let iconName = 'sync';
                  let iconColor = '#3B82F6';
                  if (text.toLowerCase().includes('ingest') || text.toLowerCase().includes('complete') || text.toLowerCase().includes('success') || text.toLowerCase().includes('executed')) {
                    iconName = 'checkmark-circle';
                    iconColor = '#10b981';
                  } else if (text.toLowerCase().includes('warn') || text.toLowerCase().includes('critical') || text.toLowerCase().includes('insufficient')) {
                    iconName = 'warning';
                    iconColor = '#ef4444';
                  }
                  
                  return (
                    <View key={index} style={styles.traceRow}>
                      <Text style={styles.traceTime}>[{time}]</Text>
                      <Ionicons name={iconName} size={16} color={iconColor} style={{ marginHorizontal: 6 }} />
                      <Text style={[styles.traceText, { color: iconColor === '#ef4444' ? '#ef4444' : '#e2e8f0' }]} numberOfLines={2}>
                        {text}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <>
                  <View style={styles.traceRow}>
                    <Text style={styles.traceTime}>[LIVE]</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginHorizontal: 6 }} />
                    <Text style={styles.traceText} numberOfLines={1}>Agent core fully loaded. System active.</Text>
                  </View>
                  <View style={styles.traceRow}>
                    <Text style={styles.traceTime}>[LIVE]</Text>
                    <Ionicons name="sync" size={16} color="#3B82F6" style={{ marginHorizontal: 6 }} />
                    <Text style={styles.traceText} numberOfLines={1}>Listening to context datastreams...</Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Pending Actions */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={[styles.cardTitleRow, { marginBottom: 16 }]}>
              <Ionicons name="flash" size={20} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Pending Actions</Text>
            </View>

            <View style={styles.actionItems}>
              {analysisResult?.recommendedActions && analysisResult.recommendedActions.length > 0 ? (
                analysisResult.recommendedActions.map((action) => (
                  <TouchableOpacity 
                    key={action.id} 
                    style={styles.actionItem}
                    onPress={() => navigation.navigate('Actions')}
                  >
                    <View style={styles.actionItemLeft}>
                      <View style={[
                        styles.actionIconContainer,
                        { backgroundColor: action.urgency === 'critical' || action.urgency === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }
                      ]}>
                        <Ionicons 
                          name={action.simulationSupported ? "play-circle" : "shield"} 
                          size={18} 
                          color={action.urgency === 'critical' || action.urgency === 'high' ? '#ef4444' : '#10b981'} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle} numberOfLines={1}>{action.title}</Text>
                        <Text style={styles.actionItemDesc} numberOfLines={1}>{action.targetSystem} • Confidence {action.confidence}</Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptySubCard}>
                  <Ionicons name="shield-checkmark" size={24} color="#10b981" style={{ marginBottom: 6 }} />
                  <Text style={styles.emptySubCardText}>No actionable adjustments compiled. System is stable.</Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Base canvas from docs/DESIGN.md
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // Glassmorphic sticky top
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headerTitle: {
    color: '#3B82F6',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  vizContainer: {
    paddingVertical: 4,
  },
  vizRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vizLabel: {
    color: '#94a3b8',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    marginBottom: Spacing.xs,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileName: {
    color: '#ffffff',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: FontSizes.sm,
  },
  statValue: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
  },
  traceContainer: {
    backgroundColor: 'transparent',
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  traceTime: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'System',
    marginRight: 4,
    fontWeight: 'bold',
  },
  traceText: {
    color: '#e2e8f0',
    fontSize: 13,
    flex: 1,
  },
  actionItems: {
    gap: 8,
  },
  actionItem: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionItemTitle: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  actionItemDesc: {
    color: '#94a3b8',
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  emptySubCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptySubCardText: {
    color: '#94a3b8',
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});
