import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { getProfile } from '../services/profileService';

// Import Reusable Design System Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function IngestionScreen({ navigation }) {
  const { user } = useAuth();
  const { feedItems, analyzeContent, setSelectedItem, clearAnalysis, addManualAnalysisItem } = useAnalysis();
  
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, news, alerts
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
            concerns: 'fuel costs, delivery margins, customer churn',
            riskSensitivity: 'balanced'
          });
        }
      } catch (error) {
        setProfile({
          businessName: 'Apex Logistics Inc.',
          industry: 'Delivery & Logistics',
          locations: 'Lahore, Karachi, Islamabad',
          concerns: 'fuel costs, delivery margins, customer churn',
          riskSensitivity: 'balanced'
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchContext();
  }, [user]);

  const handleFeedItemSelect = async (item) => {
    setSelectedItem(item);
    clearAnalysis();
    navigation.navigate('Understanding');
    // Start automated analysis using the saved profile
    analyzeContent(item.body, profile);
  };

  const handleManualAnalyze = () => {
    if (!manualBody.trim()) {
      Alert.alert('Empty Content', 'Please paste or enter some news/reports to analyze.');
      return;
    }
    const title = manualTitle.trim() || 'Manual Operational Analysis';
    const newItem = addManualAnalysisItem(title, manualBody);
    setSelectedItem(newItem);
    clearAnalysis();
    navigation.navigate('Understanding');
    // Start automated analysis using the saved profile
    analyzeContent(manualBody, profile);
  };

  // Filter feed items based on active tab
  const filteredFeed = feedItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'news') return item.sourceType === 'news';
    if (activeTab === 'alerts') return item.sourceType === 'alert';
    return true;
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
              <Ionicons name="shield-checkmark" size={18} color="#10b981" />
              <Text style={styles.indicatorTitle}>SAVED CONTEXT ACTIVE</Text>
            </View>
            {isLoadingProfile ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Multi-Source Feed</Text>
            <Text style={styles.sectionSubtitle}>Select real-time streams to run automated checks</Text>
          </View>

          {/* Tab Filters */}
          <View style={styles.tabContainer}>
            {['all', 'news', 'alerts'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feed List */}
          <View style={styles.feedList}>
            {filteredFeed.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleFeedItemSelect(item)}
                activeOpacity={0.8}
              >
                <Card variant="surface" style={{ marginBottom: 12 }}>
                  <View style={styles.feedCardHeader}>
                    <View style={styles.sourceRow}>
                      <Ionicons name={getSourceIcon(item.sourceType)} size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                      <Text style={styles.sourceText}>{item.sourceName}</Text>
                    </View>
                    <Badge 
                      label={item.relevanceStatus} 
                      variant={item.relevanceStatus === 'relevant' ? 'success' : item.relevanceStatus === 'ignored' ? 'neutral' : 'active'} 
                    />
                  </View>

                  <Text style={styles.feedCardTitle}>{item.title}</Text>
                  <Text style={styles.feedCardBody} numberOfLines={2}>{item.body}</Text>
                  
                  <View style={styles.feedCardFooter}>
                    <View style={styles.topicRow}>
                      {item.detectedTopics.map((topic, i) => (
                        <View key={i} style={styles.topicTag}>
                          <Text style={styles.topicTagText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.timeText}>{item.timestamp}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
              placeholderTextColor="#94a3b8"
              value={manualTitle}
              onChangeText={setManualTitle}
            />
            
            <View style={styles.divider} />
            
            <TextInput
              style={styles.manualBodyInput}
              placeholder="Paste raw text, market updates, or regulatory policies here to check operational alignment..."
              placeholderTextColor="#94a3b8"
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
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorTitle: {
    color: '#10b981', // Colors.success
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  profileNameText: {
    color: '#e4e2e4', // Colors.onSurface
    fontSize: 16,
    fontWeight: '700',
  },
  profileMetaText: {
    color: '#a3a3a3',
    fontSize: 12,
    marginTop: 2,
  },
  profileBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B', // Slate border
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Electric Blue translucent
    borderColor: '#3B82F6', // Electric Blue border
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#3B82F6',
  },
  feedList: {
    marginBottom: 24,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  feedCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  feedCardBody: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  feedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicRow: {
    flexDirection: 'row',
  },
  topicTag: {
    backgroundColor: '#1E293B', // Slate L2
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  topicTagText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '500',
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
  },
  manualTitleInput: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B', // Slate 1px border
    marginVertical: 4,
  },
  manualBodyInput: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
    height: 120,
  },
});
