import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { getProfile } from '../services/profileService';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import ContentItemCard from '../components/common/ContentItemCard';

const DEMO_SAMPLES = [
  {
    title: 'Fuel prices increased by 12% effective immediately',
    body: 'The Ministry of Energy has announced a sudden 12% hike in base fuel and diesel prices, effective midnight. The adjustment is attributed to global crude price spikes and fluctuations in import tariffs.',
  },
  {
    title: 'New tax regulations for logistics companies',
    body: 'The Federal Board of Revenue has mandated a 5% additional tax on all inter-city commercial transport operators starting next fiscal quarter.',
  }
];

export default function NewContentScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { feedItems, analyzeContent, addManualAnalysisItem } = useAnalysis();
  const [profile, setProfile] = useState(null);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showDemos, setShowDemos] = useState(false);

  useEffect(() => {
    if (isFocused && user?.uid) {
      loadProfile();
    }
  }, [isFocused, user?.uid]);

  const loadProfile = async () => {
    try {
      const activeProfile = await getProfile(user.uid);
      if (!activeProfile) {
        navigation.replace('Onboarding');
      } else {
        setProfile(activeProfile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async () => {
    if (!body.trim() || !profile) return;
    
    const contentToAnalyze = title.trim() ? `${title}\n\n${body}` : body;
    const newItem = addManualAnalysisItem(title || 'Manual Input', body);
    
    // Fire and forget analysis
    analyzeContent(contentToAnalyze, profile, newItem.id);
    
    // Navigate immediately to AnalysisRun
    navigation.navigate('AnalysisRun');
    
    // Reset form
    setTitle('');
    setBody('');
  };

  const handleFeedItemSelect = (item) => {
    if (!profile) return;
    const contentToAnalyze = `${item.title}\n\n${item.body}`;
    analyzeContent(contentToAnalyze, profile, item.id);
    navigation.navigate('AnalysisRun');
  };

  const loadDemo = (demo) => {
    setTitle(demo.title);
    setBody(demo.body);
    setShowDemos(false);
  };

  if (!profile) return <Screen />;

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardView} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={true}>
        <SectionHeader 
          title="Analyze New Content" 
          subtitle={`Using profile: ${profile.businessName}`}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Headline or Title (Optional)"
            placeholderTextColor={Colors.placeholder}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={styles.bodyInput}
            placeholder="Paste article text, operational update, policy changes, or risk reports here..."
            placeholderTextColor={Colors.placeholder}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.demoLink}
              onPress={() => setShowDemos(!showDemos)}
            >
              <Ionicons name="flask-outline" size={16} color={Colors.accent} />
              <Text style={styles.demoText}>Load Sample</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.analyzeBtn, !body.trim() && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={!body.trim()}
            >
              <Text style={styles.analyzeBtnText}>Analyze</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {showDemos && (
          <View style={styles.demoContainer}>
            {DEMO_SAMPLES.map((demo, idx) => (
              <TouchableOpacity key={idx} style={styles.demoItem} onPress={() => loadDemo(demo)}>
                <Text style={styles.demoItemTitle}>{demo.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <SectionHeader title="Recent Feed" />
        <View style={styles.feedContainer}>
          {feedItems.slice(0, 5).map(item => (
            <ContentItemCard 
              key={item.id} 
              item={item} 
              onPress={handleFeedItemSelect} 
            />
          ))}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inputContainer: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  titleInput: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  bodyInput: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 120,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  demoText: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  analyzeBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  analyzeBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  analyzeBtnText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
  },
  demoContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 8,
  },
  demoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  demoItemTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  feedContainer: {
    paddingHorizontal: 20,
  },
});
