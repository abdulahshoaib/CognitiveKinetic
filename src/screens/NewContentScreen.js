import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import ContentItemCard from '../components/common/ContentItemCard';

const DEMO_SAMPLES = [
  {
    icon: 'droplet',
    title: 'Fuel Shock',
    tag: '12% Increase',
    body: 'Fuel prices increased by 12% effective immediately due to import tariffs.',
  },
  {
    icon: 'dollar-sign',
    title: 'New Transport Tax',
    tag: '5% Levy',
    body: ' mandating a 5% additional tax on all inter-city commercial transport operators starting next quarter.',
  },
  {
    icon: 'truck',
    title: 'Port Gridlock',
    tag: '48h Delay',
    body: 'Port congestion causing import/export delays of up to 48 hours for shipping operations.',
  }
];

const getDensityStyle = (density) => {
  switch (density) {
    case 'compact':
      return {
        padding: 12,
        gap: 8,
        fontSizeTitle: FontSizes.md,
        fontSizeBody: FontSizes.xs,
        cardPadding: 12,
        cardMarginBottom: 10,
        bannerPadding: 12,
      };
    case 'spacious':
      return {
        padding: 24,
        gap: 20,
        fontSizeTitle: FontSizes.xl,
        fontSizeBody: FontSizes.md,
        cardPadding: 20,
        cardMarginBottom: 24,
        bannerPadding: 22,
      };
    case 'cozy':
    default:
      return {
        padding: 18,
        gap: 14,
        fontSizeTitle: FontSizes.lg,
        fontSizeBody: FontSizes.sm,
        cardPadding: 16,
        cardMarginBottom: 16,
        bannerPadding: 16,
      };
  }
};

export default function NewContentScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { preferences, activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const { feedItems, analyzeContent, addManualAnalysisItem } = useAnalysis();
  const [profile, setProfile] = useState(null);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const density = preferences.density || 'cozy';
  const ds = getDensityStyle(density);

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
    
    // Start agent pipeline
    analyzeContent(contentToAnalyze, profile, newItem.id);
    
    // Navigate immediately to pipeline trace visualizer
    navigation.navigate('AnalysisRun');
    
    // Clear inputs
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
  };

  if (!profile) return <Screen style={{ backgroundColor: c.background }} />;

  return (
    <KeyboardAvoidingView 
      style={[styles.keyboardView, { backgroundColor: c.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={true}>
        {/* Banner highlighting active profile context */}
        <View style={[styles.profileBanner, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.bannerPadding, marginHorizontal: ds.padding, marginTop: ds.padding }]}>
          <View style={styles.profileBannerHeader}>
            <View style={styles.profileBannerTitleContainer}>
              <Feather name="shield" size={16} color={c.accent} />
              <Text style={[styles.profileBannerTitle, { color: c.textPrimary }]}>Active Business Context</Text>
            </View>
            <View style={styles.activePillContainer}>
              <View style={[styles.activeDot, { backgroundColor: c.success }]} />
              <Text style={[styles.activeText, { color: c.success }]}>Auto-Loaded</Text>
            </View>
          </View>
          <View style={styles.profileBannerStatsRow}>
            <View style={[styles.tagBadge, { backgroundColor: c.surfaceContainerHighest }]}>
              <Text style={[styles.tagBadgeText, { color: c.textSecondary }]}>{profile.domain || 'Logistics'}</Text>
            </View>
            <View style={[styles.tagBadge, { backgroundColor: c.surfaceContainerHighest }]}>
              <Text style={[styles.tagBadgeText, { color: c.textSecondary }]}>{profile.riskSensitivity || 'High'} Risk</Text>
            </View>
          </View>
          <Text style={[styles.profileBannerDesc, { color: c.textSecondary, fontSize: ds.fontSizeBody }]} numberOfLines={2}>
            Incoming signals will be checked against <Text style={{ color: c.textPrimary, fontWeight: 'bold' }}>{profile.businessName}</Text> operating in <Text style={{ color: c.textPrimary }}>{profile.operatingLocations}</Text>.
          </Text>
        </View>

        <SectionHeader 
          title="Manual Ingestion" 
          subtitle="Paste market reports, policy mandates, or custom operational updates."
          style={{ paddingHorizontal: ds.padding, marginTop: ds.padding }}
        />

        <View style={[styles.inputContainer, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, marginHorizontal: ds.padding, marginBottom: ds.padding }]}>
          <TextInput
            style={[styles.titleInput, { color: c.textPrimary, borderBottomColor: c.surfaceBorder }]}
            placeholder="Update Title or Source Headline (Optional)"
            placeholderTextColor={c.placeholder}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.bodyInput, { color: c.textPrimary }]}
            placeholder="Paste text update details..."
            placeholderTextColor={c.placeholder}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <View style={[styles.actionRow, { backgroundColor: c.surfaceContainerLowest, borderTopColor: c.surfaceBorder }]}>
            <Text style={[styles.characterCountText, { color: c.textSecondary }]}>
              {body.length} characters
            </Text>
            
            <TouchableOpacity 
              style={[styles.analyzeBtn, { backgroundColor: body.trim() ? c.accent : c.surfaceVariant }]}
              onPress={handleAnalyze}
              disabled={!body.trim()}
            >
              <Text style={[styles.analyzeBtnText, { color: c.white }]}>Analyze Using Profile</Text>
              <Feather name="zap" size={14} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium interactive sample scenario grid */}
        <SectionHeader 
          title="Sample Scenarios" 
          subtitle="Select a predefined signal to simulate immediate analysis."
          style={{ paddingHorizontal: ds.padding }}
        />
        <View style={[styles.scenarioGrid, { paddingHorizontal: ds.padding, gap: ds.gap }]}>
          {DEMO_SAMPLES.map((demo, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.scenarioCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.cardPadding }]}
              onPress={() => loadDemo(demo)}
            >
              <View style={styles.scenarioCardHeader}>
                <View style={[styles.scenarioIconBox, { backgroundColor: c.primarySubtle }]}>
                  <Feather name={demo.icon} size={16} color={c.primary} />
                </View>
                <View style={[styles.tagLabel, { backgroundColor: c.accentSubtle }]}>
                  <Text style={[styles.tagLabelText, { color: c.accent }]}>{demo.tag}</Text>
                </View>
              </View>
              <Text style={[styles.scenarioTitle, { color: c.textPrimary }]} numberOfLines={1}>{demo.title}</Text>
              <Text style={[styles.scenarioBody, { color: c.textSecondary }]} numberOfLines={2}>{demo.body}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader 
          title="Recent Activity Feed" 
          subtitle="Ingested data points queued for agent analysis."
          style={{ paddingHorizontal: ds.padding, marginTop: ds.padding * 1.5 }}
        />
        <View style={[styles.feedContainer, { paddingHorizontal: ds.padding, paddingBottom: 120 }]}>
          {feedItems.slice(0, 4).map(item => (
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
  },
  profileBanner: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  profileBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileBannerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBannerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  activePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: FontSizes.xs - 2,
    fontWeight: FontWeights.bold,
  },
  profileBannerStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  profileBannerDesc: {
    lineHeight: 18,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  titleInput: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  bodyInput: {
    fontSize: FontSizes.md,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 110,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  characterCountText: {
    fontSize: FontSizes.xs,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  analyzeBtnText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
  },
  scenarioGrid: {
    flexDirection: 'column',
  },
  scenarioCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagLabelText: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
  },
  scenarioTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  scenarioBody: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  feedContainer: {
    gap: 12,
  },
});
