import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { getProfile } from '../services/profileService';

// Import Reusable Design System Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Colors from '../constants/colors';

export default function IngestionScreen({ navigation }) {
  const { user } = useAuth();
  const { feedItems, analyzeContent, setSelectedItem, clearAnalysis, addManualAnalysisItem } = useAnalysis();
  
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, news, alerts
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load profile context
  useEffect(() => {
    const fetchContext = async () => {
      if (!user) return;
      try {
        const loadedProfile = await getProfile(user.uid);
        if (loadedProfile) {
          setProfile(loadedProfile);
        } else {
          // Default demo fallback if Firestore has no profile document
          setProfile({
            businessName: 'Apex Logistics Inc.',
            industry: 'Delivery & Logistics',
            locations: 'Lahore, Karachi, Islamabad',
            customers: 'Local Retailers & B2C E-commerce',
            goals: 'Optimize delivery margins, mitigate fuel price fluctuations, and decrease customer churn.',
            concerns: 'fuel costs, delivery margins, customer churn',
            risks: 'Compressing operating margins on long-distance routes',
            riskSensitivity: 'balanced'
          });
        }
      } catch (error) {
        setProfile({
          businessName: 'Apex Logistics Inc.',
          industry: 'Delivery & Logistics',
          locations: 'Lahore, Karachi, Islamabad',
          customers: 'Local Retailers & B2C E-commerce',
          goals: 'Optimize delivery margins, mitigate fuel price fluctuations, and decrease customer churn.',
          concerns: 'fuel costs, delivery margins, customer churn',
          risks: 'Compressing operating margins on long-distance routes',
          riskSensitivity: 'balanced'
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchContext();
  }, [user]);

  const startAnalysisForItem = async (item) => {
    if (!profile) {
      Alert.alert('Profile Loading', 'Wait for the saved profile to load before running analysis.');
      return;
    }
    clearAnalysis();
    setSelectedItem(item);
    navigation.navigate('Understanding');
    analyzeContent(item.body, profile, item.id);
  };

  const toggleFeedSelection = (item) => {
    if (item.relevanceStatus === 'ignored') return;
    setSelectedFeedIds(prev => (
      prev.includes(item.id) ? [] : [item.id]
    ));
  };

  const handleAnalyzeSelected = () => {
    const selectedItems = feedItems.filter(item => selectedFeedIds.includes(item.id) && item.relevanceStatus !== 'ignored');
    if (selectedItems.length === 0) {
      Alert.alert('No Content Selected', 'Select at least one feed item to analyze using the saved profile.');
      return;
    }
    startAnalysisForItem(selectedItems[0]);
  };

  const handleManualAnalyze = () => {
    if (!profile) {
      Alert.alert('Profile Loading', 'Wait for the saved profile to load before running analysis.');
      return;
    }
    if (!manualBody.trim()) {
      Alert.alert('Empty Content', 'Please paste or enter some news/reports to analyze.');
      return;
    }
    const title = manualTitle.trim() || 'Manual Operational Analysis';
    const newItem = addManualAnalysisItem(title, manualBody);
    clearAnalysis();
    setSelectedItem(newItem);
    navigation.navigate('Understanding');
    analyzeContent(manualBody, profile, newItem.id);
    setManualTitle('');
    setManualBody('');
  };

  // Filter feed items based on active tab
  const filteredFeed = feedItems.filter(item => {
    if (activeTab === 'all') return true;
    const status = item.relevanceStatus || 'pending';
    return status === activeTab;
  });

  const getSourceIcon = (type) => {
    switch (type) {
      case 'news': return 'newspaper';
      case 'alert': return 'warning';
      case 'sports': return 'football';
      case 'entertainment': return 'film';
      default: return 'document-text';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'high-impact') return 'High Impact';
    return (status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Saved Profile Summary Indicator */}
          <Card variant="glass" active={true} style={{ marginBottom: 24 }}>
            <View style={styles.indicatorHeader}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
              <Text style={styles.indicatorTitle}>SAVED CONTEXT ACTIVE</Text>
            </View>
            {isLoadingProfile ? (
              <ActivityIndicator size="small" color={Colors.accent} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <View>
                <Text style={styles.profileNameText}>{profile?.businessName}</Text>
                <Text style={styles.profileMetaText} numberOfLines={1}>
                  Sector: {profile?.industry} | Scope: {profile?.locations}
                </Text>
                <Text style={styles.profileBadgeText}>
                  Relevance signals will match "{profile?.concerns}" automatically.
                </Text>
              </View>
            )}
          </Card>

          {/* Section: Multi-Source Content Feed */}
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Data Stream Feed</Text>
              <Text style={styles.sectionSubtitle}>Real-time ingestion logs from multi-source agents. Awaiting execution context.</Text>
            </View>
            <View style={styles.headerActionRow}>
              <TouchableOpacity style={styles.filterButton} onPress={() => setActiveTab('pending')}>
                <Ionicons name="filter" size={16} color={Colors.textPrimary} />
                <Text style={styles.filterButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.analyzeSelectedButton} onPress={handleAnalyzeSelected}>
                <Ionicons name="play" size={16} color={Colors.textPrimary} />
                <Text style={styles.analyzeSelectedButtonText}>Analyze Selected ({selectedFeedIds.length})</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Filters */}
          <View style={styles.tabContainer}>
            {['all', 'pending', 'relevant', 'high-impact', 'ignored'].map((tab) => {
              // Calculate counts for display
              let count = feedItems.length;
              if (tab !== 'all') {
                count = feedItems.filter(item => (item.relevanceStatus || 'pending') === tab).length;
              }
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.tabButtonActive,
                    tab === 'ignored' && { opacity: 0.7 }
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  {tab === 'high-impact' && <View style={styles.tabDot} />}
                  <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                    {tab === 'high-impact' ? 'High Impact' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <Text style={{ opacity: 0.7 }}>  {count}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feed List */}
          <View style={styles.feedList}>
            {filteredFeed.map((item) => {
              const isIgnored = item.relevanceStatus === 'ignored';
              const isHighImpact = item.relevanceStatus === 'high-impact';
              
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => !isIgnored && startAnalysisForItem(item)}
                  activeOpacity={isIgnored ? 1 : 0.8}
                >
                  <View style={[
                    styles.feedCard,
                    isHighImpact && styles.feedCardHighImpact,
                    isIgnored && styles.feedCardIgnored
                  ]}>
                    {/* Hover state effect layer would go here in React DOM, using View style for RN */}
                    <View style={styles.feedCardHeader}>
                      <View style={styles.sourceRow}>
                        <TouchableOpacity
                          style={[
                          styles.checkbox,
                          isIgnored && styles.checkboxDisabled,
                          selectedFeedIds.includes(item.id) && styles.checkboxChecked
                          ]}
                          onPress={(event) => {
                            event.stopPropagation();
                            toggleFeedSelection(item);
                          }}
                          activeOpacity={isIgnored ? 1 : 0.8}
                        >
                          {selectedFeedIds.includes(item.id) && <Ionicons name="checkmark" size={12} color={Colors.accent} />}
                        </TouchableOpacity>
                        <View style={styles.sourceTypeBadge}>
                          <Ionicons name={getSourceIcon(item.sourceType)} size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                          <Text style={styles.sourceTypeText}>{item.sourceType}</Text>
                        </View>
                      </View>
                      <Text style={styles.timeText}>{item.timestamp}</Text>
                    </View>

                    <Text style={[
                      styles.feedCardTitle,
                      isIgnored && { color: Colors.textSecondary, fontWeight: '400' }
                    ]}>{item.title}</Text>
                    
                    {!isIgnored && <Text style={styles.feedCardBody} numberOfLines={2}>{item.body}</Text>}
                    
                    <View style={styles.feedCardFooter}>
                      <View style={styles.topicRow}>
                        <Badge 
                          label={getStatusLabel(item.relevanceStatus)} 
                          variant={
                            item.relevanceStatus === 'relevant' ? 'success' : 
                            item.relevanceStatus === 'high-impact' ? 'high-impact' : 
                            item.relevanceStatus === 'ignored' ? 'ignored' : 'neutral'
                          } 
                          style={{ marginRight: 8 }}
                        />
                        {item.detectedTopics.map((topic, i) => (
                          <Text key={i} style={styles.topicTagText}>#{topic.replace(/\s+/g, '_').toLowerCase()}</Text>
                        ))}
                      </View>
                      <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section: Manual Ingestion */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pasted Custom Input</Text>
            <Text style={styles.sectionSubtitle}>Manually analyze news reports, documents or market alerts</Text>
          </View>

          <Card variant="surface" style={{ marginBottom: 24 }}>
            <TextInput
              style={styles.manualTitleInput}
              placeholder="Analysis Header (e.g. Market Cost Fluctuations)"
              placeholderTextColor={Colors.textSecondary}
              value={manualTitle}
              onChangeText={setManualTitle}
            />
            
            <View style={styles.divider} />
            
            <TextInput
              style={styles.manualBodyInput}
              placeholder="Paste raw text, market updates, or regulatory policies here to check operational alignment..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={manualBody}
              onChangeText={setManualBody}
            />

            <Button
              label="Analyze Using Saved Profile"
              onPress={handleManualAnalyze}
              variant="primary"
              icon="color-wand"
              style={{ marginTop: 12 }}
            />
          </Card>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorTitle: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  profileNameText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  profileMetaText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  profileBadgeText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'column',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  filterButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  analyzeSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeSelectedButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.surfaceBorder,
    borderColor: Colors.surfaceBorder,
  },
  tabButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: Colors.textPrimary,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginRight: 6,
  },
  feedList: {
    marginBottom: 24,
  },
  feedCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'column',
  },
  feedCardHighImpact: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  feedCardIgnored: {
    opacity: 0.6,
    borderColor: 'rgba(30, 41, 59, 0.5)',
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.accent,
  },
  checkboxDisabled: {
    borderColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sourceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sourceTypeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  feedCardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedCardBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  feedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicTagText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  manualTitleInput: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 4,
  },
  manualBodyInput: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
    height: 120,
  },
});
