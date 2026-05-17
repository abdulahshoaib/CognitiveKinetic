import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, FlatList, ScrollView, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';

// ── Aggregator registry ──
const AGGREGATOR_OPTIONS = [
  // International
  { id: 'google_news', name: 'Google News', icon: 'globe', desc: 'Google News RSS feeds', category: 'International' },
  { id: 'newsapi', name: 'NewsAPI', icon: 'server', desc: 'newsapi.org — API key required', category: 'International', needsKey: true },
  { id: 'bing_news', name: 'Bing News', icon: 'search', desc: 'Microsoft Bing News — API key required', category: 'International', needsKey: true },
  { id: 'reddit', name: 'Reddit', icon: 'message-circle', desc: 'Subreddit feeds — no key needed', category: 'International' },
  { id: 'hackernews', name: 'Hacker News', icon: 'terminal', desc: 'YC Hacker News top stories', category: 'International' },
  // Pakistani
  { id: 'dawn', name: 'Dawn News', icon: 'file-text', desc: 'dawn.com RSS — no key needed', category: 'Pakistan' },
  { id: 'geo', name: 'Geo News', icon: 'file-text', desc: 'geo.tv RSS — no key needed', category: 'Pakistan' },
  { id: 'express_tribune', name: 'Express Tribune', icon: 'file-text', desc: 'tribune.com.pk RSS — no key needed', category: 'Pakistan' },
  { id: 'ary', name: 'ARY News', icon: 'file-text', desc: 'arynews.tv RSS — no key needed', category: 'Pakistan' },
  { id: 'business_recorder', name: 'Business Recorder', icon: 'trending-up', desc: 'brecorder.com RSS — no key needed', category: 'Pakistan' },
  // Custom
  { id: 'rss_custom', name: 'Custom RSS', icon: 'rss', desc: 'Any RSS / Atom feed URL', category: 'Custom', needsUrl: true },
];

// ── Mock data ──
const MOCK_AGGREGATOR_NEWS = [
  { id: 'agg_1', sourceType: 'news', sourceName: 'Google News', title: 'Global supply chain disruption deepens amid port strikes', body: 'Major ports across Europe face prolonged strikes, causing cascading delays for importers. Analysts project a 15-20% increase in shipping costs over the next quarter.', timestamp: '25 mins ago', relevanceStatus: 'pending', detectedTopics: ['Supply Chain', 'Shipping', 'Trade'] },
  { id: 'agg_2', sourceType: 'news', sourceName: 'Reuters via NewsAPI', title: 'Central bank signals aggressive rate hikes through Q3', body: 'The State Bank announced potential rate hikes of up to 200 basis points citing inflationary pressures from energy imports and food supply constraints.', timestamp: '1 hour ago', relevanceStatus: 'pending', detectedTopics: ['Finance', 'Interest Rates', 'Economy'] },
  { id: 'agg_3', sourceType: 'news', sourceName: 'Reddit', title: 'Diesel shortage reported across Punjab distribution network', body: 'Multiple trucking companies report fuel shortages at key distribution hubs in Lahore, Faisalabad, and Multan regions.', timestamp: '3 hours ago', relevanceStatus: 'pending', detectedTopics: ['Fuel', 'Logistics', 'Punjab'] },
  { id: 'agg_4', sourceType: 'news', sourceName: 'Hacker News', title: 'AI route optimization cuts fleet costs by 18%', body: 'New study shows ML-based route planning reduces fuel consumption and idle time significantly for mid-size delivery fleets.', timestamp: '5 hours ago', relevanceStatus: 'pending', detectedTopics: ['AI', 'Fleet Management', 'Cost Reduction'] },
];

const MOCK_AGENT_NEWS = [
  { id: 'agent_1', sourceType: 'alert', sourceName: 'CK Agent', title: 'Fuel prices increased by 12% effective immediately', body: 'The Ministry of Energy has announced a sudden 12% hike in base fuel and diesel prices, effective midnight. Transportation networks and heavy haulers are advised to brace for severe margin pressures.', timestamp: '15 mins ago', relevanceStatus: 'pending', detectedTopics: ['Fuel Costs', 'Logistics', 'Operational Costs'] },
  { id: 'agent_2', sourceType: 'alert', sourceName: 'CK Agent', title: 'Commercial vehicle restrictions on Mall Road Lahore', body: 'Heavy cargo vehicles and delivery vans face strict access hours on Mall Road due to environmental smog control. Operations restricted 8 AM – 8 PM.', timestamp: '2 hours ago', relevanceStatus: 'pending', detectedTopics: ['Lahore Operations', 'Regulatory'] },
  { id: 'agent_3', sourceType: 'news', sourceName: 'CK Agent', title: 'New 5% inter-city transport levy proposed', body: 'Draft legislation mandates a 5% additional tax on all inter-city commercial transport operators starting next quarter.', timestamp: '5 hours ago', relevanceStatus: 'pending', detectedTopics: ['Tax', 'Transport Policy'] },
];

const ANALYZED_NEWS_STORAGE_KEY = '@cognitive_kinetic_analyzed_news_';

const normalizeNewsText = (value) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const getNewsAnalysisKey = (item) =>
  `${normalizeNewsText(item?.title)}::${normalizeNewsText(item?.body)}`;

export default function NewContentScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const { analyzeContent, addManualAnalysisItem } = useAnalysis();
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Multi-select aggregators
  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [aggregatorModalVisible, setAggregatorModalVisible] = useState(false);
  const [apiKeys, setApiKeys] = useState({}); // { aggregatorId: 'key string' }

  // Business keywords for aggregator filtering
  const [businessKeywords, setBusinessKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Keyword filter for aggregator news
  const [aggKeywordFilter, setAggKeywordFilter] = useState('');

  // Agent prompt modal
  const [agentPromptModalVisible, setAgentPromptModalVisible] = useState(false);
  const [agentSystemPrompt, setAgentSystemPrompt] = useState(
    'You are a news collection agent. Gather news relevant to:\n• Fuel prices and energy policy\n• Transport and logistics regulation\n• Trade and supply chain disruptions\n• Tax policy changes affecting commercial operations\n\nPrioritize breaking alerts and policy changes over general market commentary.'
  );

  // News detail modal
  const [detailItem, setDetailItem] = useState(null);
  const [analyzedNews, setAnalyzedNews] = useState({ ids: [], keys: [] });

  // Dismissed items + undo toast
  const [dismissedIds, setDismissedIds] = useState([]);
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused && user?.uid) loadProfile();
  }, [isFocused, user?.uid]);

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
    analyzeContent(content, profile, newItem.id);
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
    analyzeContent(`${item.title}\n\n${item.body}`, profile, item.id);
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

  // Toggle aggregator in multi-select
  const toggleAggregator = (agg) => {
    setSelectedAggregators(prev =>
      prev.find(a => a.id === agg.id)
        ? prev.filter(a => a.id !== agg.id)
        : [...prev, agg]
    );
  };

  // Filter aggregator news by keyword
  const filteredAggNews = useMemo(() => {
    if (!aggKeywordFilter.trim()) return MOCK_AGGREGATOR_NEWS;
    const kw = aggKeywordFilter.toLowerCase();
    return MOCK_AGGREGATOR_NEWS.filter(item =>
      item.title.toLowerCase().includes(kw) ||
      item.body.toLowerCase().includes(kw) ||
      item.detectedTopics.some(t => t.toLowerCase().includes(kw))
    );
  }, [aggKeywordFilter]);

  // Group aggregators by category for display — must be before early return
  const aggCategories = useMemo(() => {
    const cats = [];
    let lastCat = '';
    AGGREGATOR_OPTIONS.forEach(a => {
      if (a.category !== lastCat) {
        cats.push({ type: 'header', category: a.category, id: `cat_${a.category}` });
        lastCat = a.category;
      }
      cats.push({ type: 'item', ...a });
    });
    return cats;
  }, []);

  if (!profile) return <Screen style={{ backgroundColor: c.background }} />;

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !businessKeywords.includes(kw)) {
      setBusinessKeywords(prev => [...prev, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) => {
    setBusinessKeywords(prev => prev.filter(k => k !== kw));
  };

  // ── Aggregator Modal (multi-select + keywords) ──
  const renderAggregatorModal = () => (
    <Modal visible={aggregatorModalVisible} animationType="slide" transparent onRequestClose={() => setAggregatorModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>News Aggregators</Text>
            <TouchableOpacity onPress={() => setAggregatorModalVisible(false)}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={aggCategories}
            keyExtractor={i => i.id}
            style={styles.aggList}
            ListHeaderComponent={
              <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
                Select one or more sources. Pakistani sources use free RSS feeds.
              </Text>
            }
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <Text style={[styles.catHeader, { color: c.textSecondary }]}>{item.category}</Text>
                );
              }
              const on = !!selectedAggregators.find(a => a.id === item.id);
              const needsExtra = (item.needsKey || item.needsUrl) && on;
              const extraMissing = needsExtra && !apiKeys[item.id]?.trim();
              return (
                <View>
                  <TouchableOpacity
                    style={[styles.aggRow, { backgroundColor: on ? c.primarySubtle : c.surfaceContainerLowest, borderColor: on ? c.primary : c.surfaceBorder, marginBottom: needsExtra ? 0 : 8, borderBottomLeftRadius: needsExtra ? 0 : 12, borderBottomRightRadius: needsExtra ? 0 : 12 }]}
                    onPress={() => toggleAggregator(item)}
                  >
                    <View style={[styles.aggIcon, { backgroundColor: on ? c.primary : c.surfaceVariant }]}>
                      <Feather name={item.icon} size={16} color={on ? c.white : c.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aggName, { color: c.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.aggDesc, { color: c.textSecondary }]}>{item.desc}</Text>
                    </View>
                    <Feather name={on ? 'check-square' : 'square'} size={20} color={on ? c.primary : c.textSecondary} />
                  </TouchableOpacity>
                  {needsExtra && (
                    <View style={[styles.apiKeyRow, { borderColor: extraMissing ? c.error || '#ef4444' : c.surfaceBorder, backgroundColor: c.surfaceContainerLowest }]}>
                      <Feather name={item.needsUrl ? 'link' : 'key'} size={14} color={extraMissing ? c.error || '#ef4444' : c.textSecondary} />
                      <TextInput
                        style={[styles.apiKeyInput, { color: c.textPrimary }]}
                        placeholder={item.needsUrl ? 'https://example.com/feed.xml' : `Enter ${item.name} API key`}
                        placeholderTextColor={c.placeholder}
                        value={apiKeys[item.id] || ''}
                        onChangeText={v => setApiKeys(prev => ({ ...prev, [item.id]: v }))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={item.needsUrl ? 'url' : 'default'}
                      />
                    </View>
                  )}
                </View>
              );
            }}
            ListFooterComponent={
              <>
                {/* Business Keywords Section */}
                <View style={[styles.kwSection, { borderTopColor: c.surfaceBorder }]}>
                  <Text style={[styles.kwTitle, { color: c.textPrimary }]}>Business Keywords</Text>
                  <Text style={[styles.kwSubtitle, { color: c.textSecondary }]}>
                    Add keywords so only news relevant to your business appears.
                  </Text>
                  <View style={[styles.kwInputRow, { borderColor: c.surfaceBorder, backgroundColor: c.surfaceContainerLowest }]}>
                    <TextInput
                      style={[styles.kwInput, { color: c.textPrimary }]}
                      placeholder="e.g. fuel, logistics, tax..."
                      placeholderTextColor={c.placeholder}
                      value={keywordInput}
                      onChangeText={setKeywordInput}
                      onSubmitEditing={addKeyword}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={addKeyword} style={[styles.kwAddBtn, { backgroundColor: c.primary }]}>
                      <Feather name="plus" size={16} color={c.white} />
                    </TouchableOpacity>
                  </View>
                  {businessKeywords.length > 0 && (
                    <View style={styles.kwChips}>
                      {businessKeywords.map(kw => (
                        <View key={kw} style={[styles.chip, { backgroundColor: c.accentSubtle }]}>
                          <Text style={[styles.chipText, { color: c.accent }]}>{kw}</Text>
                          <TouchableOpacity onPress={() => removeKeyword(kw)}>
                            <Feather name="x" size={12} color={c.accent} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Selected summary */}
                {selectedAggregators.length > 0 && (
                  <View style={[styles.selectedSummary, { borderTopColor: c.surfaceBorder }]}>
                    <Text style={[styles.selectedCount, { color: c.textSecondary }]}>
                      {selectedAggregators.length} source{selectedAggregators.length > 1 ? 's' : ''} selected
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {selectedAggregators.map(a => (
                        <View key={a.id} style={[styles.chip, { backgroundColor: c.primarySubtle }]}>
                          <Text style={[styles.chipText, { color: c.primary }]}>{a.name}</Text>
                          <TouchableOpacity onPress={() => toggleAggregator(a)}>
                            <Feather name="x" size={12} color={c.primary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            }
          />

          {(() => {
            const hasKeywords = businessKeywords.length > 0;
            const reqAggs = selectedAggregators.filter(a => a.needsKey || a.needsUrl);
            const allInputsProvided = reqAggs.every(a => apiKeys[a.id]?.trim());
            const canSave = hasKeywords && allInputsProvided;
            const reason = !hasKeywords ? 'Add business keywords' : !allInputsProvided ? 'Provide API keys / URLs for selected sources' : '';
            return (
              <View>
                {!canSave && reason ? (
                  <View style={styles.validationRow}>
                    <Feather name="alert-circle" size={14} color={c.error || '#ef4444'} />
                    <Text style={[styles.validationText, { color: c.error || '#ef4444' }]}>{reason}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: canSave ? c.accent : c.surfaceVariant }]}
                  onPress={() => setAggregatorModalVisible(false)}
                  disabled={!canSave}
                >
                  <Feather name="check" size={16} color={c.white} />
                  <Text style={[styles.modalSaveBtnText, { color: c.white }]}>Done</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </View>
    </Modal>
  );

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
            onPress={() => setAgentPromptModalVisible(false)}
          >
            <Feather name="cpu" size={16} color={c.white} />
            <Text style={[styles.modalSaveBtnText, { color: c.white }]}>Save Agent Instructions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const detailAlreadyAnalyzed = isNewsAnalyzed(detailItem);

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
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
              <Text style={[styles.analyzeBtnText, { color: c.white }]}>Analyze Using Profile</Text>
              <Feather name="zap" size={14} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 1: Agent Collected (TOP) ── */}
        <SectionHeader
          title="Agent Collected"
          subtitle="News and signals automatically gathered by your CK agent."
          rightElement={
            <TouchableOpacity style={[styles.secBtn, { backgroundColor: c.accentSubtle }]} onPress={() => setAgentPromptModalVisible(true)}>
              <Feather name="cpu" size={14} color={c.accent} />
              <Text style={[styles.secBtnText, { color: c.accent }]}>Edit Prompt</Text>
            </TouchableOpacity>
          }
          style={{ paddingHorizontal: 20, marginTop: 20 }}
        />
        <View style={styles.feed}>
          {MOCK_AGENT_NEWS.filter(i => !dismissedIds.includes(i.id)).map(item => {
            const alreadyAnalyzed = isNewsAnalyzed(item);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, opacity: alreadyAnalyzed ? 0.72 : 1 }]}
                onPress={() => setDetailItem(item)}
              >
                <View style={styles.compactLeft}>
                  <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                  <Text style={[styles.compactTime, { color: c.textSecondary }]}>{item.timestamp}</Text>
                  {alreadyAnalyzed && (
                    <View style={[styles.analyzedBadge, { backgroundColor: c.successSoft, borderColor: c.successBorder }]}>
                      <Feather name="check-circle" size={11} color={c.success} />
                      <Text style={[styles.analyzedBadgeText, { color: c.success }]}>Analyzed</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section 2: News Aggregator Feed ── */}
        <SectionHeader
          title="News Aggregator"
          subtitle={selectedAggregators.length ? `Pulling from ${selectedAggregators.map(a => a.name).join(', ')}` : 'Connect external news sources to pull content.'}
          rightElement={
            <TouchableOpacity style={[styles.secBtn, { backgroundColor: c.primarySubtle }]} onPress={() => setAggregatorModalVisible(true)}>
              <Feather name="settings" size={14} color={c.primary} />
              <Text style={[styles.secBtnText, { color: c.primary }]}>
                {selectedAggregators.length ? `${selectedAggregators.length} Sources` : 'Connect'}
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

        <View style={[styles.feed, { paddingBottom: 120 }]}>
          {selectedAggregators.length > 0 ? (
            filteredAggNews.filter(i => !dismissedIds.includes(i.id)).length > 0 ? (
              filteredAggNews.filter(i => !dismissedIds.includes(i.id)).map(item => {
                const alreadyAnalyzed = isNewsAnalyzed(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, opacity: alreadyAnalyzed ? 0.72 : 1 }]}
                    onPress={() => setDetailItem(item)}
                  >
                    <View style={styles.compactLeft}>
                      <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                      <Text style={[styles.compactTime, { color: c.textSecondary }]}>{item.timestamp}</Text>
                      {alreadyAnalyzed && (
                        <View style={[styles.analyzedBadge, { backgroundColor: c.successSoft, borderColor: c.successBorder }]}>
                          <Feather name="check-circle" size={11} color={c.success} />
                          <Text style={[styles.analyzedBadgeText, { color: c.success }]}>Analyzed</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
                <Feather name="search" size={20} color={c.textSecondary} />
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>No news matching "{aggKeywordFilter}"</Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, borderStyle: 'dashed' }]}
              onPress={() => setAggregatorModalVisible(true)}
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
      </Screen>

      {renderAggregatorModal()}
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
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  analyzeBtnText: { fontWeight: FontWeights.bold, fontSize: FontSizes.sm },

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

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 36, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  modalDesc: { fontSize: FontSizes.sm, lineHeight: 20, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  modalSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 18, paddingVertical: 14, borderRadius: 12 },
  modalSaveBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },

  // Aggregator list
  aggList: { paddingHorizontal: 20, flexGrow: 0 },
  catHeader: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
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
