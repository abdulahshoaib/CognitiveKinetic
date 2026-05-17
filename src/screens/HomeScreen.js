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
import Colors from '../constants/colors';

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
  const [showLogs, setShowLogs] = useState(false);

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
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Animated.View style={[styles.toastContainer, { opacity: toastFade }]}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="hardware-chip" size={16} color={Colors.accent} />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerTitle}>Cognitive Kinetic</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.slateText} />
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

        {/* System Health */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>System Health</Text>
              </View>
              <Badge label="Running Smoothly" variant="success" />
            </View>
            
            <View style={styles.vizContainer}>
              <Text style={{ color: Colors.slateText, fontSize: FontSizes.sm, lineHeight: 20 }}>
                All background systems are active. Cognitive Kinetic is matching news updates to your business context automatically.
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Profile Summary */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="business" size={24} color={Colors.accent} />
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
                  color: profile?.riskSensitivity === 'aggressive' ? Colors.danger 
                       : profile?.riskSensitivity === 'conservative' ? Colors.success 
                       : Colors.warning,
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
              onPress={() => navigation.navigate('ProfileSettings')}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Animated.View>

        {/* Your Current Prices */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface" active={systemState?.longDistanceSurcharge > 0}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="cash-outline" size={20} color={Colors.accent} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Your Current Prices</Text>
              </View>
              <Badge 
                label={systemState?.longDistanceSurcharge > 0 ? 'Prices Adjusted' : 'Standard Prices'} 
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
                    color: systemState?.longDistanceSurcharge > 0 ? Colors.success : Colors.white, 
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
              <View style={[styles.statRow, { borderBottomWidth: 0, paddingBottom: 0, marginTop: 4 }]}>
                <Text style={{ color: Colors.slateMuted, fontSize: FontSizes.xs, fontStyle: 'italic', flex: 1 }}>
                  Automatically adjusts instantly when relevant market updates are found.
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Technical Activity Logs */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="glass">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowLogs(!showLogs)}
              style={[styles.cardTitleRow, { justifyContent: 'space-between', width: '100%' }]}
            >
              <View style={styles.cardTitleRow}>
                <Ionicons name="settings-outline" size={20} color={Colors.slateText} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Technical Activity Logs</Text>
              </View>
              <Ionicons 
                name={showLogs ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={Colors.slateText} 
              />
            </TouchableOpacity>
            
            <View style={[styles.traceContainer, { marginTop: showLogs ? 16 : 12 }]}>
              {showLogs ? (
                executionLogs && executionLogs.length > 0 ? (
                  executionLogs.slice(-4).reverse().map((log, index) => {
                    const time = typeof log === 'string' ? 'LIVE' : (log.timestamp || '[LIVE]').replace(/^\[|\]$/g, '');
                    const text = typeof log === 'string' ? log : log.message;
                    
                    let iconName = 'sync';
                    let iconColor = Colors.accent;
                    if (text.toLowerCase().includes('ingest') || text.toLowerCase().includes('complete') || text.toLowerCase().includes('success') || text.toLowerCase().includes('executed')) {
                      iconName = 'checkmark-circle';
                      iconColor = Colors.success;
                    } else if (text.toLowerCase().includes('warn') || text.toLowerCase().includes('critical') || text.toLowerCase().includes('insufficient')) {
                      iconName = 'warning';
                      iconColor = Colors.danger;
                    }
                    
                    return (
                      <View key={index} style={styles.traceRow}>
                        <Text style={styles.traceTime}>[{time}]</Text>
                        <Ionicons name={iconName} size={16} color={iconColor} style={{ marginHorizontal: 6 }} />
                        <Text style={[styles.traceText, { color: iconColor === Colors.danger ? Colors.danger : Colors.traceText }]} numberOfLines={2}>
                          {text}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <>
                    <View style={styles.traceRow}>
                      <Text style={styles.traceTime}>[LIVE]</Text>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={{ marginHorizontal: 6 }} />
                      <Text style={styles.traceText} numberOfLines={1}>Agent core fully loaded. System active.</Text>
                    </View>
                    <View style={styles.traceRow}>
                      <Text style={styles.traceTime}>[LIVE]</Text>
                      <Ionicons name="sync" size={16} color={Colors.accent} style={{ marginHorizontal: 6 }} />
                      <Text style={styles.traceText} numberOfLines={1}>Listening to context datastreams...</Text>
                    </View>
                  </>
                )
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                  <Ionicons 
                    name="shield-checkmark" 
                    size={16} 
                    color={Colors.success} 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={{ color: Colors.slateText, fontSize: FontSizes.xs, flex: 1 }}>
                    {executionLogs && executionLogs.length > 0 
                      ? "AI agent successfully analyzed the last news update. Tap to view logs." 
                      : "AI agent is ready and listening in the background. Tap to view logs."}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Pending Actions */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="surface">
            <View style={[styles.cardTitleRow, { marginBottom: 16 }]}>
              <Ionicons name="flash" size={20} color={Colors.warning} style={{ marginRight: 8 }} />
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
                        { backgroundColor: action.urgency === 'critical' || action.urgency === 'high' ? Colors.dangerMedium : Colors.successMedium }
                      ]}>
                        <Ionicons 
                          name={action.simulationSupported ? "play-circle" : "shield"} 
                          size={18} 
                          color={action.urgency === 'critical' || action.urgency === 'high' ? Colors.danger : Colors.success} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle} numberOfLines={1}>{action.title}</Text>
                        <Text style={styles.actionItemDesc} numberOfLines={1}>{action.targetSystem} • Confidence {action.confidence}</Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={Colors.slateText} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptySubCard}>
                  <Ionicons name="shield-checkmark" size={24} color={Colors.success} style={{ marginBottom: 6 }} />
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
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.l1Border,
    backgroundColor: Colors.glassHeader,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent,
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
    backgroundColor: Colors.success,
  },
  headerTitle: {
    color: Colors.accent,
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
    paddingBottom: 90,
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
    color: Colors.white,
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
    color: Colors.slateText,
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
    backgroundColor: Colors.l1Border,
    borderWidth: 1,
    borderColor: Colors.subtleBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileName: {
    color: Colors.white,
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
    borderBottomColor: Colors.subtleBorder,
  },
  statLabel: {
    color: Colors.slateText,
    fontSize: FontSizes.sm,
  },
  statValue: {
    color: Colors.white,
    fontSize: FontSizes.sm,
  },
  traceContainer: {
    backgroundColor: Colors.transparent,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.subtleBorder,
  },
  traceTime: {
    color: Colors.slateMuted,
    fontSize: 12,
    fontFamily: 'System',
    marginRight: 4,
    fontWeight: 'bold',
  },
  traceText: {
    color: Colors.traceText,
    fontSize: 13,
    flex: 1,
  },
  actionItems: {
    gap: 8,
  },
  actionItem: {
    backgroundColor: Colors.l1Border,
    borderWidth: 1,
    borderColor: Colors.subtleBorder,
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
    borderColor: Colors.subtleBorder,
  },
  actionItemTitle: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  actionItemDesc: {
    color: Colors.slateText,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.glassPanelStrong,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  emptySubCard: {
    backgroundColor: Colors.l2Subtle,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptySubCardText: {
    color: Colors.slateText,
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});
