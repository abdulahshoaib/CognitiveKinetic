import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, ScrollView, RefreshControl, ActivityIndicator,
  Alert, ToastAndroid
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import BrandIcon from '../components/common/BrandIcon';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { useIntegrations } from '../context/IntegrationsContext';
import { usePreferences } from '../context/PreferencesContext';
import { getArchivedFeedItems } from '../services/feedService';
import { getProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import { newsSourcesToAggregatorSetup } from '../components/settings/NewsAggregatorModal';

const getSourceIcon = (sourceKey, sourceName) => {
  const name = String(sourceName || sourceKey || '').toLowerCase();
  if (name.includes('google')) return 'globe';
  if (name.includes('reddit')) return 'message-square';
  if (name.includes('hacker') || name.includes('ycombinator')) return 'terminal';
  if (name.includes('newsapi') || name.includes('api')) return 'server';
  if (name.includes('agent') || name.includes('ck')) return 'cpu';
  return 'rss';
};

export default function NewContentScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const {
    feedItems,
    refreshFeedItems,
    dismissFeedItem,
    analyzeFeedItem,
    analyzeContent,
    addManualAnalysisItem
  } = useAnalysis();
  const { newsAggregators, newsSystemPrompt, setNewsAggregators, updateNewsSystemPrompt } = useIntegrations();
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [archivedItems, setArchivedItems] = useState([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [sourceSettingsModalVisible, setSourceSettingsModalVisible] = useState(false);

  // Agent prompt modal
  const [agentPromptModalVisible, setAgentPromptModalVisible] = useState(false);
  const [agentSystemPrompt, setAgentSystemPrompt] = useState(
    newsSystemPrompt
  );

  // News detail modal
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    if (isFocused && user?.uid) loadProfile();
  }, [isFocused, user?.uid]);

  useEffect(() => {
    const setup = newsSourcesToAggregatorSetup(newsAggregators.filter(source => source.enabled !== false));
    setSelectedAggregators(setup.selectedAggregators);
  }, [newsAggregators]);

  useEffect(() => {
    setAgentSystemPrompt(newsSystemPrompt);
  }, [newsSystemPrompt]);

  const unreadFeedItems = useMemo(() => {
    return feedItems.filter(item => item?.status === 'unread');
  }, [feedItems]);

  const visibleAgentNews = useMemo(() => {
    return unreadFeedItems;
  }, [unreadFeedItems]);

  const loadProfile = async () => {
    try {
      const p = await getProfile(user.uid);
      if (!p) navigation.replace('Onboarding');
      else setProfile(p);
    } catch (e) { console.error(e); }
  };

  const _dbgToast = (msg) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.LONG);
    } else {
      Alert.alert('DEBUG', msg);
    }
  };

  const handleAnalyze = async () => {
    if (!body.trim() || !profile) return;
    _dbgToast('T1: Button pressed. body ok, profile ok. Creating feed item...');
    const content = title.trim() ? `${title}\n\n${body}` : body;
    const newItem = await addManualAnalysisItem(title || 'Manual Input', body);
    if (!newItem) {
      _dbgToast('T2-FAIL: addManualAnalysisItem returned null! Feed item not created.');
      return;
    }
    _dbgToast(`T2-OK: Feed item created. id=${newItem.id}. Calling analyzeContent...`);
    analyzeContent(content, profile, newItem.id, newItem);
    navigation.navigate('AnalysisRun');
    setTitle('');
    setBody('');
  };

  const isNewsAnalyzed = (item) => {
    if (!item) return false;
    return item.status === 'analyzed';
  };

  const handleFeedItemSelect = async (item) => {
    if (!profile || isNewsAnalyzed(item)) return;
    setDetailItem(null);
    navigation.navigate('AnalysisRun');
    await analyzeFeedItem(item.id);
  };

  const handleDismiss = async (item) => {
    setDetailItem(null);
    await dismissFeedItem(item.id);
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

  const getDisplayTime = (item) => {
    if (!item) return '';
    if (item.publishedAt) {
      try {
        const d = new Date(item.publishedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
      } catch {}
    }
    return item.timestamp || 'Recent';
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus(null);

    try {
      const result = await refreshFeedItems();
      setRefreshStatus(result?.status === 'success' ? 'added' : 'empty');
    } catch (err) {
      console.error(err);
      setRefreshStatus('empty');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openArchive = async () => {
    if (!user?.uid || isArchiveLoading) return;
    setArchiveVisible(true);
    setIsArchiveLoading(true);
    try {
      setArchivedItems(await getArchivedFeedItems(user.uid));
    } catch (err) {
      console.error('Unable to load archived feed items:', err);
      setArchivedItems([]);
    } finally {
      setIsArchiveLoading(false);
    }
  };

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
            Tip: Be specific about industries, regions, risks, and alert types.
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
                    <View style={styles.sourceRowIcon}>
                      <BrandIcon type={source.type} name={source.name} size={16} enabled={enabled} />
                    </View>
                    <View style={styles.sourceRowText}>
                      <Text style={[styles.sourceRowTitle, { color: c.textPrimary }]} numberOfLines={1}>{source.name}</Text>
                      {['custom_rss', 'custom_api'].includes(source.type) && !!source.sourceUrl && (
                        <Text style={[styles.sourceRowUrl, { color: c.textSecondary }]} numberOfLines={1}>
                          {source.sourceUrl}
                        </Text>
                      )}
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
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text style={[styles.screenTitle, { color: c.textPrimary }]}>New Content</Text>
              <Text style={[styles.screenSub, { color: c.textSecondary }]}>
                Ingest external news, policy updates, and market reports to evaluate against your saved profile.
              </Text>
            </View>
            <TouchableOpacity style={[styles.archiveTopButton, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]} onPress={openArchive}>
              <Feather name="archive" size={16} color={c.textPrimary} />
              <Text style={[styles.archiveTopButtonText, { color: c.textPrimary }]}>Archive</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.screenSub, { color: c.textSecondary }]}>
            The saved profile is reused automatically. New analysis only needs new content.
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
                Only agent-selected relevant items are shown in this feed.
              </Text>
            </View>
          </View>
        )}

        {/* Agent-selected multi-source feed */}
        <SectionHeader
          title="Agent-Selected Feed"
          subtitle={selectedAggregators.length === 0 ? 'No selected news aggregator' : `Filtered from ${selectedAggregators.map(a => a.name).join(', ')}`}
          rightElement={
            <TouchableOpacity style={[styles.secBtn, { backgroundColor: c.accentSubtle }]} onPress={openControlNewsSources}>
              <Feather name="cpu" size={14} color={c.accent} />
              <Text style={[styles.secBtnText, { color: c.accent }]}>Sources</Text>
            </TouchableOpacity>
          }
          style={{ paddingHorizontal: 20, marginTop: 20 }}
        />
        <View style={styles.feed}>
          {selectedAggregators.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: 24 }]}>
              <Feather name="alert-triangle" size={22} color={c.warning || '#D97706'} />
              <Text style={[styles.emptyText, { color: c.textPrimary, fontWeight: 'bold', marginTop: 8, fontSize: 15 }]}>
                No Selected News Aggregator
              </Text>
              <Text style={{ color: c.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 6, paddingHorizontal: 12, lineHeight: 18 }}>
                Configure or enable at least one news source in Settings to build your customized feed.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: c.accent, marginTop: 14, paddingHorizontal: 16, paddingVertical: 10 }]}
                onPress={openControlNewsSources}
              >
                <Feather name="settings" size={14} color={c.white} />
                <Text style={[styles.emptyBtnText, { color: c.white }]}>Go to Profile Settings</Text>
              </TouchableOpacity>
            </View>
          ) : visibleAgentNews.length > 0 ? (
            visibleAgentNews.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
                onPress={() => setDetailItem(item)}
              >
                <View style={styles.compactLeft}>
                  <View style={[styles.sourceMiniBadge, { marginRight: 2 }]}>
                    <BrandIcon type={item.sourceId} name={item.sourceName} size={10} enabled={true} style={{ borderRadius: 4 }} />
                  </View>
                  <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                  <Text style={[styles.compactTime, { color: c.textSecondary }]}>{getDisplayTime(item)}</Text>
                </View>
                <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                {(item.summary || item.brief || item.body) && (
                  <Text style={[styles.compactBrief, { color: c.textSecondary }]} numberOfLines={2}>
                    {item.summary || item.brief || item.body}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              <Feather name="check-circle" size={20} color={c.textSecondary} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>No selected feed items right now.</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </Screen>

      {renderSourceSettingsModal()}
      {renderAgentPromptModal()}

      <Modal visible={archiveVisible} animationType="slide" transparent onRequestClose={() => setArchiveVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Archived Feed Items</Text>
              <TouchableOpacity onPress={() => setArchiveVisible(false)}>
                <Feather name="x" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            {isArchiveLoading ? (
              <View style={styles.archiveLoading}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : (
              <ScrollView style={styles.archiveScroll} contentContainerStyle={styles.archiveList}>
                {archivedItems.length > 0 ? archivedItems.map(item => (
                  <View
                    key={item.id}
                    style={[styles.archiveRow, { borderColor: c.surfaceBorderSubtle, backgroundColor: c.surfaceContainerLowest }]}
                  >
                    <View style={styles.archiveRowMeta}>
                      <View style={[styles.sourceMiniBadge, { marginRight: 2 }]}>
                        <BrandIcon type={item.sourceId} name={item.sourceName} size={10} enabled={true} style={{ borderRadius: 4 }} />
                      </View>
                      <Text style={[styles.compactSource, { color: c.textSecondary }]}>{item.sourceName}</Text>
                      <Text style={[styles.compactTime, { color: c.textSecondary }]}>{getDisplayTime(item)}</Text>
                    </View>
                    <Text style={[styles.compactTitle, { color: c.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.archiveBrief, { color: c.textSecondary }]} numberOfLines={3}>
                      {item.brief || item.summary || item.body || ''}
                    </Text>
                  </View>
                )) : (
                  <View style={[styles.sourceEmpty, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}>
                    <Feather name="archive" size={18} color={c.textSecondary} />
                    <Text style={[styles.sourceEmptyText, { color: c.textSecondary }]}>No archived feed items yet.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
                <View style={{ width: 22, height: 22 }}>
                  <BrandIcon type={detailItem?.sourceId} name={detailItem?.sourceName} size={12} enabled={true} style={{ borderRadius: 6 }} />
                </View>
                <Text style={[styles.detailSource, { color: c.textSecondary }]}>{detailItem?.sourceName}</Text>
                <Text style={[styles.detailTime, { color: c.textSecondary }]}>{getDisplayTime(detailItem)}</Text>
              </View>
              <Text style={[styles.detailBody, { color: c.textPrimary }]}>{detailItem?.summary || detailItem?.body || ''}</Text>
              {(detailItem?.topics || detailItem?.detectedTopics || []).length > 0 && (
                <View style={styles.detailTopics}>
                  {(detailItem?.topics || detailItem?.detectedTopics || []).map((t, i) => (
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

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerTextBlock: { flex: 1 },
  screenTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  screenSub: { marginTop: 2, fontSize: FontSizes.sm, lineHeight: FontSizes.sm * 1.4 },
  archiveTopButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  archiveTopButtonText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },

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
  sourceMiniBadge: { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  compactCard: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  compactLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  compactSource: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  compactTime: { fontSize: FontSizes.xs - 1 },
  compactTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 20 },
  compactBrief: { fontSize: FontSizes.xs, lineHeight: 18, marginTop: 6 },
  analyzedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  analyzedBadgeText: { fontSize: FontSizes.xs - 1, fontWeight: FontWeights.bold, textTransform: 'uppercase' },
  archiveWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  archiveBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  archiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  archiveIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  archiveTitleBlock: { flex: 1 },
  archiveTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, lineHeight: 19 },
  archiveDesc: { fontSize: FontSizes.xs, lineHeight: 17, marginTop: 2 },
  archiveLoading: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  archiveScroll: { maxHeight: 460 },
  archiveList: { padding: 14, gap: 8 },
  archiveRow: { borderWidth: 1, borderRadius: 10, padding: 12 },
  archiveRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  archiveBrief: { fontSize: FontSizes.xs, lineHeight: 18, marginTop: 6 },
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
