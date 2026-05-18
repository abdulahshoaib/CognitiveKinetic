import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, ScrollView, Animated, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { useIntegrations } from '../context/IntegrationsContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import { newsSourcesToAggregatorSetup } from '../components/settings/NewsAggregatorModal';

// ── Mock data ──
const MOCK_AGGREGATOR_NEWS = [
  { id: 'agg_1', sourceType: 'news', sourceKey: 'google_news', sourceName: 'Google News', title: 'Global supply chain disruption deepens amid port strikes', body: 'Major ports across Europe face prolonged strikes, causing cascading delays for importers. Analysts project a 15-20% increase in shipping costs over the next quarter.', timestamp: '25 mins ago', relevanceStatus: 'pending', detectedTopics: ['Supply Chain', 'Shipping', 'Trade'], url: 'https://news.google.com/search?q=supply+chain+port+strikes', sourceUrl: 'https://news.google.com/rss/search?q=supply+chain+port+strikes' },
  { id: 'agg_2', sourceType: 'news', sourceKey: 'newsapi', sourceName: 'NewsAPI', title: 'Central bank signals aggressive rate hikes through Q3', body: 'The State Bank announced potential rate hikes of up to 200 basis points citing inflationary pressures from energy imports and food supply constraints.', timestamp: '1 hour ago', relevanceStatus: 'pending', detectedTopics: ['Finance', 'Interest Rates', 'Economy'], url: 'https://newsapi.org/', sourceUrl: 'https://newsapi.org/v2/everything?q=central+bank+rates' },
  { id: 'agg_3', sourceType: 'news', sourceKey: 'reddit', sourceName: 'Reddit', title: 'Diesel shortage reported across Punjab distribution network', body: 'Multiple trucking companies report fuel shortages at key distribution hubs in Lahore, Faisalabad, and Multan regions.', timestamp: '3 hours ago', relevanceStatus: 'pending', detectedTopics: ['Fuel', 'Logistics', 'Punjab'], url: 'https://www.reddit.com/search/?q=diesel%20shortage%20punjab', sourceUrl: 'https://www.reddit.com/search.rss?q=diesel%20shortage%20punjab' },
  { id: 'agg_4', sourceType: 'news', sourceKey: 'hackernews', sourceName: 'Hacker News', title: 'AI route optimization cuts fleet costs by 18%', body: 'New study shows ML-based route planning reduces fuel consumption and idle time significantly for mid-size delivery fleets.', timestamp: '5 hours ago', relevanceStatus: 'pending', detectedTopics: ['AI', 'Fleet Management', 'Cost Reduction'], url: 'https://news.ycombinator.com/', sourceUrl: 'https://hnrss.org/frontpage' },
];

const MOCK_AGENT_NEWS = [
  { id: 'agent_1', sourceType: 'alert', sourceName: 'CK Agent', title: 'Fuel prices increased by 12% effective immediately', body: 'The Ministry of Energy has announced a sudden 12% hike in base fuel and diesel prices, effective midnight. Transportation networks and heavy haulers are advised to brace for severe margin pressures.', timestamp: '15 mins ago', relevanceStatus: 'pending', detectedTopics: ['Fuel Costs', 'Logistics', 'Operational Costs'], url: 'https://example.com/ck-agent/fuel-price-alert', sourceUrl: 'ck-agent://fuel-price-alert' },
  { id: 'agent_2', sourceType: 'alert', sourceName: 'CK Agent', title: 'Commercial vehicle restrictions on Mall Road Lahore', body: 'Heavy cargo vehicles and delivery vans face strict access hours on Mall Road due to environmental smog control. Operations restricted 8 AM - 8 PM.', timestamp: '2 hours ago', relevanceStatus: 'pending', detectedTopics: ['Lahore Operations', 'Regulatory'], url: 'https://example.com/ck-agent/lahore-vehicle-restrictions', sourceUrl: 'ck-agent://lahore-vehicle-restrictions' },
  { id: 'agent_3', sourceType: 'news', sourceName: 'CK Agent', title: 'New 5% inter-city transport levy proposed', body: 'Draft legislation mandates a 5% additional tax on all inter-city commercial transport operators starting next quarter.', timestamp: '5 hours ago', relevanceStatus: 'pending', detectedTopics: ['Tax', 'Transport Policy'], url: 'https://example.com/ck-agent/inter-city-transport-levy', sourceUrl: 'ck-agent://transport-levy' },
];

const ANALYZED_NEWS_STORAGE_KEY = '@cognitive_kinetic_analyzed_news_';

const normalizeNewsText = (value) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const getNewsAnalysisKey = (item) =>
  `${normalizeNewsText(item?.title)}::${normalizeNewsText(item?.body)}`;

const getSafeUrl = (value, fallback = '') => String(value || fallback || '').trim();

const sourceMatchesItem = (source, item) => {
  const sourceName = normalizeNewsText(source?.name);
  const itemSourceName = normalizeNewsText(item?.sourceName);
  return (
    source?.id === item?.sourceConfigId ||
    source?.type === item?.sourceKey ||
    (sourceName && sourceName === itemSourceName) ||
    (source?.type === 'newsapi' && itemSourceName.includes('newsapi')) ||
    (source?.type === 'hackernews' && itemSourceName.includes('hacker news'))
  );
};

const createSourceRefreshItem = (source, cycle, index) => {
  const keywords = Array.isArray(source.keywords) && source.keywords.length
    ? source.keywords
    : ['Operations', 'Market'];
  const primaryKeyword = keywords[0] || 'Operations';

  return {
    id: `agg_refresh_${cycle}_${source.id}_${index}`,
    sourceType: 'news',
    sourceKey: source.type,
    sourceConfigId: source.id,
    sourceName: source.name,
    title: `Fresh ${primaryKeyword} update #${cycle} from ${source.name}`,
    body: `${source.name} surfaced refresh batch ${cycle} with a new ${primaryKeyword.toLowerCase()} update for review. Agent should validate relevance against the saved profile before any action is simulated.`,
    timestamp: 'Just now',
    relevanceStatus: 'pending',
    detectedTopics: keywords.slice(0, 3),
    url: getSafeUrl(source.sourceUrl, `https://example.com/news/${source.id}`),
    sourceUrl: getSafeUrl(source.sourceUrl, `https://example.com/news/${source.id}`),
  };
};

const createAgentRefreshItem = (cycle) => ({
  id: `agent_refresh_${cycle}`,
  sourceType: 'alert',
  sourceName: 'CK Agent',
  title: cycle % 3 === 0
    ? `Competitor delivery discounts #${cycle} detected in Karachi`
    : `Fresh operating cost signal #${cycle} detected by CK Agent`,
  body: cycle % 3 === 0
    ? `The agent detected refresh batch ${cycle}: competitor promotions in Karachi that may pressure customer retention and delivery margins.`
    : `The agent found refresh batch ${cycle}: a new operating cost signal from monitored sources. Review impact before committing changes to pricing or routing.`,
  timestamp: 'Just now',
  relevanceStatus: 'pending',
  detectedTopics: cycle % 3 === 0 ? ['Customer Churn', 'Karachi', 'Pricing'] : ['Operating Cost', 'Agent Alert'],
  url: `https://example.com/ck-agent/refresh-${cycle}`,
  sourceUrl: `ck-agent://refresh-${cycle}`,
});

export default function NewContentScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const { analyzeContent, addManualAnalysisItem } = useAnalysis();
  const { newsAggregators, newsSystemPrompt, setNewsAggregators, updateNewsSystemPrompt } = useIntegrations();
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [agentNews, setAgentNews] = useState(MOCK_AGENT_NEWS);
  const [aggregatorNews, setAggregatorNews] = useState(MOCK_AGGREGATOR_NEWS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [analyzedSectionExpanded, setAnalyzedSectionExpanded] = useState(false);

  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [sourceSettingsModalVisible, setSourceSettingsModalVisible] = useState(false);
  const [aggKeywordFilter, setAggKeywordFilter] = useState('');

  // Agent prompt modal
  const [agentPromptModalVisible, setAgentPromptModalVisible] = useState(false);
  const [agentSystemPrompt, setAgentSystemPrompt] = useState(
    newsSystemPrompt
  );

  // News detail modal
  const [detailItem, setDetailItem] = useState(null);
  const [analyzedNews, setAnalyzedNews] = useState({ ids: [], keys: [] });

  // Dismissed items + undo toast
  const [dismissedIds, setDismissedIds] = useState([]);
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);
  const refreshTimer = useRef(null);
  const refreshCycle = useRef(0);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused && user?.uid) loadProfile();
  }, [isFocused, user?.uid]);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  useEffect(() => {
    const setup = newsSourcesToAggregatorSetup(newsAggregators.filter(source => source.enabled !== false));
    setSelectedAggregators(setup.selectedAggregators);
  }, [newsAggregators]);

  useEffect(() => {
    setAgentSystemPrompt(newsSystemPrompt);
  }, [newsSystemPrompt]);

  useEffect(() => {
    let mounted = true;

    const loadAnalyzedNews = async () => {
      if (!user?.uid) {
        setAnalyzedNews({ ids: [], keys: [] });
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(`${ANALYZED_NEWS_STORAGE_KEY}${user.uid}`);
        if (!mounted) return;
        if (!stored) {
          setAnalyzedNews({ ids: [], keys: [] });
          return;
        }
        const parsed = JSON.parse(stored);
        setAnalyzedNews({
          ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
          keys: Array.isArray(parsed?.keys) ? parsed.keys : [],
        });
      } catch (error) {
        console.warn('Unable to load analyzed news state:', error);
      }
    };

    loadAnalyzedNews();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const loadProfile = async () => {
    try {
      const p = await getProfile(user.uid);
      if (!p) navigation.replace('Onboarding');
      else setProfile(p);
    } catch (e) { console.error(e); }
  };

  const handleAnalyze = async () => {
    if (!body.trim() || !profile) return;
    const content = title.trim() ? `${title}\n\n${body}` : body;
    const newItem = addManualAnalysisItem(title || 'Manual Input', body);
    analyzeContent(content, profile, newItem.id, newItem);
    navigation.navigate('AnalysisRun');
    setTitle('');
    setBody('');
  };

  const isNewsAnalyzed = (item) => {
    if (!item) return false;
    return analyzedNews.ids.includes(item.id) || analyzedNews.keys.includes(getNewsAnalysisKey(item));
  };

  const markNewsAnalyzed = async (item) => {
    if (!item) return;

    const next = {
      ids: analyzedNews.ids.includes(item.id) ? analyzedNews.ids : [...analyzedNews.ids, item.id],
      keys: analyzedNews.keys.includes(getNewsAnalysisKey(item))
        ? analyzedNews.keys
        : [...analyzedNews.keys, getNewsAnalysisKey(item)],
    };

    setAnalyzedNews(next);

    if (!user?.uid) return;
    try {
      await AsyncStorage.setItem(`${ANALYZED_NEWS_STORAGE_KEY}${user.uid}`, JSON.stringify(next));
    } catch (error) {
      console.warn('Unable to save analyzed news state:', error);
    }
  };

  const handleFeedItemSelect = (item) => {
    if (!profile || isNewsAnalyzed(item)) return;
    markNewsAnalyzed(item);
    analyzeContent(`${item.title}\n\n${item.body}`, profile, item.id, item);
    navigation.navigate('AnalysisRun');
    setDetailItem(null);
  };

  // Handle Toast Lifecycle in useEffect to avoid timing/render collision
  useEffect(() => {
    if (undoItem) {
      // Fade in toast
      toastOpacity.setValue(0);
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start 5-second automatic fade out
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setUndoItem(null);
        });
      }, 5000);
    }
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, [undoItem]);

  const handleDismiss = (item) => {
    setDetailItem(null);
    setDismissedIds(prev => [...prev, item.id]);
    setUndoItem(item);
  };

  const handleUndo = () => {
    if (!undoItem) return;
    setDismissedIds(prev => prev.filter(id => id !== undoItem.id));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setUndoItem(null);
    });
  };

  const toggleNewsSource = (source) => {
    setNewsAggregators(newsAggregators.map(item => (
      item.id === source.id ? { ...item, enabled: item.enabled === false } : item
    )));
  };

  const openControlNewsSources = () => {
    setSourceSettingsModalVisible(false);
    setAgentPromptModalVisible(false);
    navigation.getParent()?.navigate('ProfileTab', {
      screen: 'SettingsMain',
      params: { tab: 'news' },
    });
  };

  const enabledNewsSources = useMemo(
    () => newsAggregators.filter(source => source.enabled !== false),
    [newsAggregators]
  );

  const configuredAggNews = useMemo(() => (
    aggregatorNews
      .map(item => {
        const source = enabledNewsSources.find(activeSource => sourceMatchesItem(activeSource, item));
        if (!source) return null;
        return {
          ...item,
          sourceName: source.name || item.sourceName,
          sourceConfigId: source.id,
          sourceKey: source.type || item.sourceKey,
          url: getSafeUrl(item.url, source.sourceUrl),
          sourceUrl: getSafeUrl(item.sourceUrl, source.sourceUrl),
        };
      })
      .filter(Boolean)
  ), [aggregatorNews, enabledNewsSources]);

  const handleRefresh = () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshStatus(null);
    setAnalyzedSectionExpanded(false);

    const nextCycle = refreshCycle.current + 1;
    refreshCycle.current = nextCycle;

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      const shouldAddNews = nextCycle % 2 === 1;
      const nextAgentNews = shouldAddNews ? [createAgentRefreshItem(nextCycle)] : [];
      const nextSourceNews = shouldAddNews
        ? enabledNewsSources.slice(0, 4).map((source, index) => createSourceRefreshItem(source, nextCycle, index))
        : [];

      if (nextAgentNews.length) {
        setAgentNews(prev => [...nextAgentNews, ...prev]);
      }
      if (nextSourceNews.length) {
        setAggregatorNews(prev => [...nextSourceNews, ...prev]);
      }

      setRefreshStatus(nextAgentNews.length || nextSourceNews.length ? 'added' : 'empty');
      setIsRefreshing(false);
    }, 650);
  };

  // Filter aggregator news by keyword
  const filteredAggNews = useMemo(() => {
    if (!aggKeywordFilter.trim()) return configuredAggNews;
    const kw = aggKeywordFilter.toLowerCase();
    return configuredAggNews.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      item.body.toLowerCase().includes(kw) ||
      (item.detectedTopics || []).some(t => t.toLowerCase().includes(kw))
    );
  }, [aggKeywordFilter, configuredAggNews]);

  if (!profile) return <Screen style={{ backgroundColor: c.background }} />;

  // ── Agent Prompt Modal ──
  const renderAgentPromptModal = () => (
    <Modal visible={agentPromptModalVisible} animationType="slide" transparent onRequestClose={() => setAgentPromptModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Agent Collection Prompt</Text>
            <TouchableOpacity onPress={() => setAgentPromptModalVisible(false)}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
            Update the system prompt so the agent knows what news and signals to collect.
          </Text>
          <TextInput
            style={[styles.promptEditor, { color: c.textPrimary, borderColor: c.surfaceBorder, backgroundColor: c.surfaceContainerLowest }]}
            multiline textAlignVertical="top"
            value={agentSystemPrompt}
            onChangeText={setAgentSystemPrompt}
            placeholder="Describe what news the agent should collect..."
            placeholderTextColor={c.placeholder}
          />
          <Text style={[styles.promptHint, { color: c.textSecondary }]}>
            Tip: Be specific about industries, regions, keywords, and alert types.
          </Text>
          <TouchableOpacity
            style={[styles.modalSaveBtn, { backgroundColor: c.accent }]}
            onPress={() => {
              updateNewsSystemPrompt(agentSystemPrompt);
              setAgentPromptModalVisible(false);
            }}
          >
            <Feather name="cpu" size={16} color={c.white} />
            <Text style={[styles.modalSaveBtnText, { color: c.white }]}>Save Agent Instructions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSourceSettingsModal = () => (
    <Modal visible={sourceSettingsModalVisible} animationType="slide" transparent onRequestClose={() => setSourceSettingsModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>News Sources</Text>
            <TouchableOpacity onPress={() => setSourceSettingsModalVisible(false)}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
            Toggle configured sources to show or hide them from this feed.
          </Text>

          <ScrollView style={styles.sourceList} contentContainerStyle={styles.sourceListContent}>
            {newsAggregators.length ? (
              newsAggregators.map(source => {
                const enabled = source.enabled !== false;
                return (
                  <TouchableOpacity
                    key={source.id}
                    style={[styles.sourceRow, { backgroundColor: c.surfaceContainerLowest, borderColor: enabled ? c.accentBorder : c.surfaceBorder, opacity: enabled ? 1 : 0.68 }]}
                    onPress={() => toggleNewsSource(source)}
                  >
                    <View style={[styles.sourceRowIcon, { backgroundColor: enabled ? c.accentSoft : c.surfaceVariant }]}>
                      <Feather name="rss" size={16} color={enabled ? c.accent : c.textSecondary} />
                    </View>
                    <View style={styles.sourceRowText}>
                      <Text style={[styles.sourceRowTitle, { color: c.textPrimary }]} numberOfLines={1}>{source.name}</Text>
                      <Text style={[styles.sourceRowUrl, { color: c.textSecondary }]} numberOfLines={1}>{source.sourceUrl || source.type}</Text>
                    </View>
                    <View style={[styles.sourceSwitchTrack, { backgroundColor: enabled ? c.successSoft : c.surfaceVariant, borderColor: enabled ? c.successBorder : c.surfaceBorder }]}>
                      <View style={[styles.sourceSwitchKnob, { backgroundColor: enabled ? c.success : c.textSecondary, alignSelf: enabled ? 'flex-end' : 'flex-start' }]} />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.sourceEmpty, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}>
                <Feather name="rss" size={18} color={c.textSecondary} />
                <Text style={[styles.sourceEmptyText, { color: c.textSecondary }]}>No configured news sources yet.</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: c.accent }]} onPress={openControlNewsSources}>
            <Feather name="settings" size={16} color={c.white} />
            <Text style={[styles.modalSaveBtnText, { color: c.white }]}>Configure Sources</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const detailAlreadyAnalyzed = isNewsAnalyzed(detailItem);
  const visibleAgentNews = agentNews.filter(item => !dismissedIds.includes(item.id) && !isNewsAnalyzed(item));
  const visibleAggregatorNews = filteredAggNews.filter(item => !dismissedIds.includes(item.id) && !isNewsAnalyzed(item));
  const analyzedArchiveItems = [...agentNews, ...configuredAggNews, ...aggregatorNews]
    .filter(item => isNewsAnalyzed(item))
    .filter((item, index, self) => self.findIndex(other => other.id === item.id) === index);

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scroll
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={c.accent}
            colors={[c.accent]}
            progressBackgroundColor={c.surfaceContainerLow}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: c.textPrimary }]}>New Content</Text>
          <Text style={[styles.screenSub, { color: c.textSecondary }]}>
            Ingest external news, policy updates, and market reports to evaluate against your saved profile.
          </Text>
        </View>

        {/* Manual paste input */}
        <View style={[styles.inputBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <TextInput
            style={[styles.titleInput, { color: c.textPrimary, borderBottomColor: c.surfaceBorder }]}
            placeholder="Update Title or Source Headline (Optional)"
            placeholderTextColor={c.placeholder}
            value={title} onChangeText={setTitle}
          />
          <TextInput
            style={[styles.bodyInput, { color: c.textPrimary }]}
            placeholder="Paste text update details..."
            placeholderTextColor={c.placeholder}
            value={body} onChangeText={setBody}
            multiline textAlignVertical="top"
          />
          <View style={[styles.actionRow, { backgroundColor: c.surfaceContainerLowest, borderTopColor: c.surfaceBorder }]}>
            <Text style={[styles.charCount, { color: c.textSecondary }]}>{body.length} chars</Text>
            <TouchableOpacity
              style={[styles.analyzeBtn, { backgroundColor: body.trim() ? c.accent : c.surfaceVariant }]}
              onPress={handleAnalyze} disabled={!body.trim()}
            >
              <Text style={[styles.analyzeBtnText, { color: c.white }]}>Analyze Using Saved Profile</Text>
              <Feather name="zap" size={14} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>

        {refreshStatus === 'empty' && (
          <View style={[styles.refreshPlaceholder, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.refreshIcon, { backgroundColor: c.surfaceVariant }]}>
              <Feather name="inbox" size={18} color={c.textSecondary} />
            </View>
            <View style={styles.refreshTextBlock}>
              <Text style={[styles.refreshTitle, { color: c.textPrimary }]}>No new news found</Text>
              <Text style={[styles.refreshDesc, { color: c.textSecondary }]}>
                Analyzed items stay hidden in the archive below.
              </Text>
            </View>
          </View>
        )}

        {/* ── Section 1: Agent Collected (TOP) ── */}
        <SectionHeader
          title="Agent Collected"
          subtitle="News and signals automatically gathered by your CK agent."
          rightElement={
            <TouchableOpacity style={[styles.secBtn, { backgroundColor: c.accentSubtle }]} onPress={openControlNewsSources}>
              <Feather name="cpu" size={14} color={c.accent} />
              <Text style={[styles.secBtnText, { color: c.accent }]}>Edit Prompt</Text>
            </TouchableOpacity>
          }
          style={{ paddingHorizontal: 20, marginTop: 20 }}
        />
        <View style={styles.feed}>
          {visibleAgentNews.length > 0 ? (
            visibleAgentNews.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
                onPress={() => setDetailItem(item)}
              >
                <View style={styles.compactLeft}>
                  <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                  <Text style={[styles.compactTime, { color: c.textSecondary }]}>{item.timestamp}</Text>
                </View>
                <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              <Feather name="check-circle" size={20} color={c.textSecondary} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>No new agent-collected items.</Text>
            </View>
          )}
        </View>

        {/* ── Section 2: News Aggregator Feed ── */}
        <SectionHeader
          title="News Aggregator"
          subtitle={selectedAggregators.length ? `Pulling from ${selectedAggregators.map(a => a.name).join(', ')}` : 'Connect external news sources to pull content.'}
          rightElement={
            <TouchableOpacity style={[styles.secBtn, { backgroundColor: c.primarySubtle }]} onPress={() => setSourceSettingsModalVisible(true)}>
              <Feather name="settings" size={14} color={c.primary} />
              <Text style={[styles.secBtnText, { color: c.primary }]}>
                {selectedAggregators.length ? `${selectedAggregators.length} Visible` : 'Sources'}
              </Text>
            </TouchableOpacity>
          }
          style={{ paddingHorizontal: 20, marginTop: 32 }}
        />

        {/* Keyword filter — shown when aggregators connected */}
        {selectedAggregators.length > 0 && (
          <View style={[styles.filterRow, { marginHorizontal: 20, backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Feather name="filter" size={14} color={c.textSecondary} />
            <TextInput
              style={[styles.filterInput, { color: c.textPrimary }]}
              placeholder="Filter by keyword..."
              placeholderTextColor={c.placeholder}
              value={aggKeywordFilter}
              onChangeText={setAggKeywordFilter}
            />
            {aggKeywordFilter.length > 0 && (
              <TouchableOpacity onPress={() => setAggKeywordFilter('')}>
                <Feather name="x-circle" size={16} color={c.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.feed}>
          {selectedAggregators.length > 0 ? (
            visibleAggregatorNews.length > 0 ? (
              visibleAggregatorNews.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
                    onPress={() => setDetailItem(item)}
                  >
                    <View style={styles.compactLeft}>
                      <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                      <Text style={[styles.compactTime, { color: c.textSecondary }]}>{item.timestamp}</Text>
                    </View>
                    <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                  </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
                <Feather name="search" size={20} color={c.textSecondary} />
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  {aggKeywordFilter ? `No news matching "${aggKeywordFilter}"` : 'No new configured-source items.'}
                </Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, borderStyle: 'dashed' }]}
              onPress={() => setSourceSettingsModalVisible(true)}
            >
              <View style={[styles.emptyIcon, { backgroundColor: c.primarySubtle }]}>
                <Feather name="rss" size={24} color={c.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>No aggregator connected</Text>
              <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
                Tap to connect Google News, NewsAPI, RSS feeds, or any news source.
              </Text>
              <View style={[styles.emptyBtn, { backgroundColor: c.primarySubtle }]}>
                <Feather name="plus" size={14} color={c.primary} />
                <Text style={[styles.emptyBtnText, { color: c.primary }]}>Connect Aggregator</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.archiveWrap}>
          {analyzedArchiveItems.length > 0 ? (
            <View style={[styles.archiveBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              <TouchableOpacity
                style={styles.archiveHeader}
                onPress={() => setAnalyzedSectionExpanded(prev => !prev)}
              >
                <View style={[styles.archiveIcon, { backgroundColor: c.successSoft }]}>
                  <Feather name="check-circle" size={16} color={c.success} />
                </View>
                <View style={styles.archiveTitleBlock}>
                  <Text style={[styles.archiveTitle, { color: c.textPrimary }]}>Analyzed Archive</Text>
                  <Text style={[styles.archiveDesc, { color: c.textSecondary }]}>
                    {analyzedArchiveItems.length} hidden item{analyzedArchiveItems.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Feather name={analyzedSectionExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
              </TouchableOpacity>

              {analyzedSectionExpanded && (
                <View style={[styles.archiveList, { borderTopColor: c.surfaceBorder }]}>
                  {analyzedArchiveItems.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.archiveRow, { borderColor: c.surfaceBorderSubtle, backgroundColor: c.surfaceContainerLowest }]}
                      onPress={() => setDetailItem(item)}
                    >
                      <View style={styles.archiveRowMeta}>
                        <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                        <Text style={[styles.compactTime, { color: c.textSecondary }]}>{item.timestamp}</Text>
                      </View>
                      <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.bottomSpacer} />
          )}
        </View>
      </Screen>

      {renderSourceSettingsModal()}
      {renderAgentPromptModal()}

      {/* News Detail Modal */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: c.textPrimary }]} numberOfLines={2}>{detailItem?.title}</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}>
                <Feather name="x" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 14, maxHeight: 400 }}>
              <View style={styles.detailMeta}>
                <Feather name="globe" size={14} color={c.textSecondary} />
                <Text style={[styles.detailSource, { color: c.textSecondary }]}>{detailItem?.sourceName}</Text>
                <Text style={[styles.detailTime, { color: c.textSecondary }]}>{detailItem?.timestamp}</Text>
              </View>
              <Text style={[styles.detailBody, { color: c.textPrimary }]}>{detailItem?.body}</Text>
              {detailItem?.detectedTopics?.length > 0 && (
                <View style={styles.detailTopics}>
                  {detailItem.detectedTopics.map((t, i) => (
                    <View key={i} style={[styles.chip, { backgroundColor: c.surfaceVariant }]}>
                      <Text style={[styles.chipText, { color: c.textSecondary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
              {detailAlreadyAnalyzed && (
                <View style={[styles.analyzedNotice, { backgroundColor: c.successSoft, borderColor: c.successBorder }]}>
                  <Feather name="check-circle" size={15} color={c.success} />
                  <Text style={[styles.analyzedNoticeText, { color: c.success }]}>
                    This news item has already been analyzed.
                  </Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.detailDismissBtn, { borderColor: c.surfaceBorder }]}
                onPress={() => handleDismiss(detailItem)}
              >
                <Feather name="x-circle" size={16} color={c.textSecondary} />
                <Text style={[styles.detailDismissText, { color: c.textSecondary }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailAnalyzeBtn, { backgroundColor: detailAlreadyAnalyzed ? c.surfaceVariant : c.accent }]}
                onPress={() => handleFeedItemSelect(detailItem)}
                disabled={detailAlreadyAnalyzed}
              >
                <Feather name={detailAlreadyAnalyzed ? 'check-circle' : 'zap'} size={16} color={detailAlreadyAnalyzed ? c.textSecondary : c.white} />
                <Text style={[styles.detailAnalyzeText, { color: detailAlreadyAnalyzed ? c.textSecondary : c.white }]}>
                  {detailAlreadyAnalyzed ? 'Already Analyzed' : 'Analyze'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo Toast */}
      {undoItem && (
        <Animated.View style={[styles.toast, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, opacity: toastOpacity }]}>
          <Text style={[styles.toastText, { color: c.textPrimary }]} numberOfLines={1}>
            Dismissed: {undoItem.title}
          </Text>
          <TouchableOpacity onPress={handleUndo} style={[styles.toastUndo, { backgroundColor: c.accent }]}>
            <Text style={[styles.toastUndoText, { color: c.white }]}>Undo</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 },
  screenTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  screenSub: { marginTop: 2, fontSize: FontSizes.sm, lineHeight: FontSizes.sm * 1.4 },

  inputBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginHorizontal: 20, marginBottom: 20 },
  titleInput: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1 },
  bodyInput: { fontSize: FontSizes.md, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, minHeight: 110 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  charCount: { fontSize: FontSizes.xs },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, flexShrink: 1 },
  analyzeBtnText: { fontWeight: FontWeights.bold, fontSize: FontSizes.sm, flexShrink: 1 },

  secBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  secBtnText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  feed: { paddingHorizontal: 20, gap: 12 },

  // Filter row
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  filterInput: { flex: 1, fontSize: FontSizes.sm, paddingVertical: 0 },

  // Empty state
  emptyCard: { borderRadius: 12, borderWidth: 1, padding: 28, alignItems: 'center' },
  emptyIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, marginBottom: 6 },
  emptyDesc: { fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 20, marginBottom: 16, maxWidth: 280 },
  emptyText: { fontSize: FontSizes.sm, marginTop: 8 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  emptyBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  refreshPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 18, borderWidth: 1, borderRadius: 12, padding: 14 },
  refreshIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  refreshTextBlock: { flex: 1 },
  refreshTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 19 },
  refreshDesc: { fontSize: FontSizes.xs, lineHeight: 17, marginTop: 2 },

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 36, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  modalDesc: { fontSize: FontSizes.sm, lineHeight: 20, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  modalSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 18, paddingVertical: 14, borderRadius: 12 },
  modalSaveBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  sourceList: { paddingHorizontal: 20, flexGrow: 0 },
  sourceListContent: { gap: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  sourceRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sourceRowText: { flex: 1 },
  sourceRowTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 19 },
  sourceRowUrl: { fontSize: FontSizes.xs, lineHeight: 17, marginTop: 2 },
  sourceSwitchTrack: { width: 44, height: 24, borderRadius: 12, borderWidth: 1, padding: 3 },
  sourceSwitchKnob: { width: 16, height: 16, borderRadius: 8 },
  sourceEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  sourceEmptyText: { flex: 1, fontSize: FontSizes.sm },

  // Aggregator list
  aggList: { paddingHorizontal: 20, flexGrow: 0 },
  catHeader: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, textTransform: 'uppercase', letterSpacing: 0, marginTop: 14, marginBottom: 8 },
  aggRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  aggIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aggName: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  aggDesc: { fontSize: FontSizes.xs, marginTop: 2 },

  // Keyword section inside modal
  kwSection: { paddingHorizontal: 20, paddingTop: 16, marginTop: 12, borderTopWidth: 1 },
  kwTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, marginBottom: 4 },
  kwSubtitle: { fontSize: FontSizes.xs, marginBottom: 10, lineHeight: 18 },
  kwInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingLeft: 14, overflow: 'hidden' },
  kwInput: { flex: 1, fontSize: FontSizes.sm, paddingVertical: 10 },
  kwAddBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  kwChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },

  // Selected summary chips
  selectedSummary: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  selectedCount: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, marginBottom: 4 },
  chipText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },

  // Agent prompt editor
  promptEditor: { borderWidth: 1, borderRadius: 12, marginHorizontal: 20, marginTop: 4, padding: 16, fontSize: FontSizes.sm, lineHeight: 22, minHeight: 180, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  promptHint: { fontSize: FontSizes.xs, paddingHorizontal: 20, marginTop: 10, fontStyle: 'italic' },

  // API key input row
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  apiKeyInput: { flex: 1, fontSize: FontSizes.sm, paddingVertical: 0 },

  // Validation
  validationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 12 },
  validationText: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },

  // Compact news card
  compactCard: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  compactLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  compactSource: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  compactTime: { fontSize: FontSizes.xs - 1 },
  compactTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 20 },
  analyzedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  analyzedBadgeText: { fontSize: FontSizes.xs - 1, fontWeight: FontWeights.bold, textTransform: 'uppercase' },
  archiveWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  archiveBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  archiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  archiveIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  archiveTitleBlock: { flex: 1 },
  archiveTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 19 },
  archiveDesc: { fontSize: FontSizes.xs, lineHeight: 17, marginTop: 2 },
  archiveList: { borderTopWidth: 1, padding: 10, gap: 8 },
  archiveRow: { borderWidth: 1, borderRadius: 10, padding: 12 },
  archiveRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bottomSpacer: { height: 104 },

  // Detail modal
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  detailSource: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, flex: 1 },
  detailTime: { fontSize: FontSizes.xs },
  detailBody: { fontSize: FontSizes.md, lineHeight: 24, marginBottom: 16 },
  detailTopics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  analyzedNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  analyzedNoticeText: { flex: 1, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  detailActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  detailDismissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  detailDismissText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  detailAnalyzeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  detailAnalyzeText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },

  // Toast
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 12, elevation: 8, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  toastText: { flex: 1, fontSize: FontSizes.sm },
  toastUndo: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  toastUndoText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
});
