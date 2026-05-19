import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import BrandIcon from '../common/BrandIcon';
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes, FontWeights } from '../../constants/typography';

export const AGGREGATOR_OPTIONS = [
  { id: 'google_news', type: 'google_news', name: 'Google News', icon: 'globe', desc: 'Get news based on your profile and agent prompt.', category: 'International' },
  { id: 'bing_news', type: 'bing_news', name: 'Bing News', icon: 'search', desc: 'Get news based on your profile and agent prompt.', category: 'International' },
  { id: 'newsapi', type: 'newsapi', name: 'NewsAPI', icon: 'server', desc: 'Connect your NewsAPI key to fetch from supported publishers.', category: 'International', needsApiKey: true },
  { id: 'hackernews', type: 'hackernews', name: 'Hacker News', icon: 'terminal', desc: 'Track startup, tech, AI, and business stories from Hacker News.', category: 'International' },
  { id: 'reddit', type: 'reddit', name: 'Reddit', icon: 'message-circle', desc: 'Track posts from specific subreddits using Reddit RSS.', category: 'International', needsSubreddit: true, allowMultiple: true },
  { id: 'dawn', type: 'dawn', name: 'Dawn News', icon: 'file-text', desc: 'Fetch from trusted Pakistani news providers managed by the backend.', category: 'Pakistan' },
  { id: 'geo', type: 'geo', name: 'Geo News', icon: 'file-text', desc: 'Fetch from trusted Pakistani news providers managed by the backend.', category: 'Pakistan' },
  { id: 'express_tribune', type: 'express_tribune', name: 'Express Tribune', icon: 'file-text', desc: 'Fetch from trusted Pakistani news providers managed by the backend.', category: 'Pakistan' },
  { id: 'ary', type: 'ary', name: 'ARY News', icon: 'file-text', desc: 'Fetch from trusted Pakistani news providers managed by the backend.', category: 'Pakistan' },
  { id: 'business_recorder', type: 'business_recorder', name: 'Business Recorder', icon: 'trending-up', desc: 'Fetch from trusted Pakistani news providers managed by the backend.', category: 'Pakistan' },
  { id: 'custom_rss', type: 'custom_rss', name: 'Custom RSS', icon: 'rss', desc: 'Add any RSS or Atom feed link.', category: 'Custom', needsUrl: true, custom: true, allowMultiple: true },
  { id: 'custom_api', type: 'custom_api', name: 'Custom API', icon: 'server', desc: 'Connect a custom news/data endpoint.', category: 'Custom', needsUrl: true, custom: true, allowMultiple: true },
];

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const createLocalId = () => `news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const getOptionByType = (type) => AGGREGATOR_OPTIONS.find(option => option.type === type || option.id === type);

export const normalizeNewsSource = (source = {}) => {
  const option = getOptionByType(source.type) || getOptionByType(source.templateId);
  const custom = source.custom === true || option?.custom === true || !option;
  const type = source.type || option?.type || 'custom_rss';
  const needsUrl = source.needsUrl === true || option?.needsUrl === true || type === 'custom_rss' || type === 'custom_api';
  const needsSubreddit = source.needsSubreddit === true || option?.needsSubreddit === true || type === 'reddit';
  const needsApiKey = source.needsApiKey === true || option?.needsApiKey === true || type === 'newsapi';
  const rawSubreddit = source.subreddit || '';
  const cleanSub = rawSubreddit.replace(/^\/?r\//i, '').trim();

  return {
    id: source.id || createLocalId(),
    name: type === 'reddit' ? (cleanSub ? `r/${cleanSub}` : 'Reddit') : (source.name || option?.name || 'Custom Source'),
    type,
    sourceUrl: needsUrl ? (source.sourceUrl || '') : '',
    subreddit: cleanSub,
    queryParams: source.queryParams || '',
    apiKey: source.apiKey || '',
    providerId: source.providerId || option?.id || type,
    enabled: source.enabled !== false,
    custom,
    needsUrl,
    needsSubreddit,
    needsApiKey,
    allowMultiple: source.allowMultiple === true || option?.allowMultiple === true || custom,
    icon: source.icon || option?.icon || (custom ? 'rss' : 'globe'),
    desc: source.desc || option?.desc || source.sourceUrl || 'Configured source',
    category: source.category || option?.category || 'Configured',
  };
};

export const sourceForStorage = (source) => {
  const cleanSub = String(source.subreddit || '').replace(/^\/?r\//i, '').trim();
  const name = source.type === 'reddit' ? (cleanSub ? `r/${cleanSub}` : 'Reddit') : String(source.name || '').trim();
  return {
    id: source.id || createLocalId(),
    name: name || 'Untitled Source',
    type: source.type || 'custom_rss',
    sourceUrl: source.needsUrl ? String(source.sourceUrl || '').trim() : '',
    subreddit: cleanSub,
    queryParams: String(source.queryParams || '').trim(),
    apiKey: String(source.apiKey || '').trim(),
    providerId: source.providerId || source.type || '',
    enabled: source.enabled !== false,
    custom: source.custom === true,
    needsUrl: source.needsUrl === true,
    needsSubreddit: source.needsSubreddit === true,
    needsApiKey: source.needsApiKey === true,
    allowMultiple: source.allowMultiple === true,
  };
};

export const createNewsSourceFromOption = (option) => normalizeNewsSource({
  id: createLocalId(),
  name: option.name,
  type: option.type,
  sourceUrl: '',
  subreddit: '',
  queryParams: '',
  apiKey: '',
  providerId: option.id,
  enabled: true,
  custom: option.custom === true,
  needsUrl: option.needsUrl === true,
  needsSubreddit: option.needsSubreddit === true,
  needsApiKey: option.needsApiKey === true,
  allowMultiple: option.allowMultiple === true,
});

export const newsSourcesToAggregatorSetup = (sources = []) => {
  const normalizedSources = sources.map(normalizeNewsSource);
  const enabledSources = normalizedSources.filter(source => source.enabled !== false);

  return {
    selectedAggregators: enabledSources.map(source => ({
      id: source.id,
      name: source.name,
      icon: source.icon,
      desc: source.subreddit ? `r/${source.subreddit}` : source.sourceUrl || source.desc,
      category: source.category,
      type: source.type,
    })),
    apiKeys: enabledSources.reduce((acc, source) => {
      if (source.sourceUrl) acc[`${source.id}_url`] = source.sourceUrl;
      if (source.subreddit) acc[`${source.id}_subreddit`] = source.subreddit;
      if (source.queryParams) acc[`${source.id}_queryParams`] = source.queryParams;
      if (source.apiKey) acc[`${source.id}_apiKey`] = source.apiKey;
      return acc;
    }, {}),
    businessKeywords: [],
    newsSources: normalizedSources.map(sourceForStorage),
  };
};

export const aggregatorSetupToNewsSources = ({
  selectedAggregators = EMPTY_ARRAY,
  apiKeys = EMPTY_OBJECT,
  businessKeywords = EMPTY_ARRAY,
} = {}) => (
  selectedAggregators.map((aggregator) => sourceForStorage(normalizeNewsSource({
    id: aggregator.id,
    name: aggregator.name,
    type: aggregator.type || aggregator.id,
    sourceUrl: apiKeys[`${aggregator.id}_url`] || aggregator.defaultUrl || '',
    subreddit: apiKeys[`${aggregator.id}_subreddit`] || '',
    queryParams: apiKeys[`${aggregator.id}_queryParams`] || '',
    apiKey: apiKeys[`${aggregator.id}_apiKey`] || '',
    enabled: true,
  })))
);

const applySetup = (sources, onApply) => {
  const storedSources = sources.map(source => sourceForStorage(normalizeNewsSource(source)));
  const setup = newsSourcesToAggregatorSetup(storedSources);
  onApply?.({ ...setup, newsSources: storedSources });
};

export function NewsSourceDetailModal({
  visible,
  source,
  onClose,
  onSave,
  onDelete,
  saveLabel = 'Save Source',
}) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const [form, setForm] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!visible || !source) return;
    setForm(normalizeNewsSource(source));
    setValidationError(null);
    setIsValidating(false);
  }, [source, visible]);

  if (!form) return null;

  const sourceEnabled = form.enabled !== false;
  const missingName = sourceEnabled && !String(form.name || '').trim();
  const missingUrl = sourceEnabled && form.needsUrl && !String(form.sourceUrl || '').trim();
  const missingSubreddit = sourceEnabled && form.needsSubreddit && !String(form.subreddit || '').trim();
  const missingApiKey = sourceEnabled && form.needsApiKey && !String(form.apiKey || '').trim();
  const canSave = !(missingName || missingUrl || missingSubreddit || missingApiKey);

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }));

  const save = async () => {
    if (!canSave) return;

    if (form.needsSubreddit) {
      setIsValidating(true);
      setValidationError(null);
      const sub = String(form.subreddit || '').replace(/^\/?r\//i, '').trim();

      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/about.json`, {
          headers: {
            'User-Agent': 'Relay/1.0.0 (Agentic News Verification)',
          }
        });

        if (res.status === 404) {
          setValidationError(`Subreddit r/${sub} does not exist.`);
          setIsValidating(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data.error === 404 || data.message === 'Not Found') {
          setValidationError(`Subreddit r/${sub} does not exist.`);
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.warn('Reddit validation error:', err);
      } finally {
        setIsValidating(false);
      }
    }

    if (form.needsUrl) {
      setIsValidating(true);
      setValidationError(null);
      const url = String(form.sourceUrl || '').trim();

      if (!/^https?:\/\//i.test(url)) {
        setValidationError('URL must start with http:// or https://');
        setIsValidating(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Relay/1.0.0 (Feed Verification)',
          }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          setValidationError(`Invalid response from URL. Status: ${res.status}`);
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.warn('URL validation error:', err);
        setValidationError('Unable to reach URL. Please make sure it is correct and online.');
        setIsValidating(false);
        return;
      } finally {
        setIsValidating(false);
      }
    }

    onSave?.(sourceForStorage(form));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Configure Feed</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Premium Read-Only Source Banner */}
            <View style={[styles.sourceHeaderCard, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}>
              <View style={styles.sourceHeaderTop}>
                <View style={styles.sourceHeaderIcon}>
                  <BrandIcon type={form.type} name={form.name} size={22} enabled={true} />
                </View>
                <View style={styles.sourceHeaderText}>
                  <Text style={[styles.sourceHeaderName, { color: c.textPrimary }]}>{form.name || 'News Source'}</Text>
                  <Text style={[styles.sourceHeaderCategory, { color: c.textSecondary }]}>{form.category || 'News'}</Text>
                  {['custom_rss', 'custom_api'].includes(form.type) && !!form.sourceUrl && (
                    <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }} numberOfLines={1}>
                      {form.sourceUrl}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.toggleRow, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}
              onPress={() => updateForm({ enabled: !sourceEnabled })}
            >
              <View style={styles.toggleTextBlock}>
                <Text style={[styles.fieldTitle, { color: c.textPrimary }]}>Enabled</Text>
                <Text style={[styles.fieldHint, { color: c.textSecondary }]}>Use source in New Content feed.</Text>
              </View>
              <View style={[styles.toggleTrack, { backgroundColor: sourceEnabled ? c.successSoft : c.surfaceVariant, borderColor: sourceEnabled ? c.successBorder : c.surfaceBorder }]}>
                <View style={[styles.toggleKnob, { backgroundColor: sourceEnabled ? c.success : c.textSecondary, alignSelf: sourceEnabled ? 'flex-end' : 'flex-start' }]} />
              </View>
            </TouchableOpacity>

            {form.custom && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Source name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingName ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                  value={form.name}
                  onChangeText={(value) => updateForm({ name: value })}
                  placeholder="e.g. My Custom RSS Feed"
                  placeholderTextColor={c.placeholder}
                />
              </View>
            )}

            {(form.type === 'google_news' || form.type === 'bing_news') && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Custom Query Parameters</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary }]}
                  value={form.queryParams}
                  onChangeText={(value) => updateForm({ queryParams: value })}
                  placeholder="e.g. logistics OR fuel OR margins"
                  placeholderTextColor={c.placeholder}
                  autoCapitalize="none"
                />
                <Text style={[styles.fieldHint, { color: c.textSecondary, marginTop: 4, fontSize: FontSizes.xs - 1 }]}>
                  Appended to the feed request query to refine news search results.
                </Text>
              </View>
            )}

            {form.needsSubreddit && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Subreddit</Text>
                <View style={[styles.subredditRow, { backgroundColor: c.surfaceContainerLowest, borderColor: missingSubreddit ? c.warning : c.surfaceBorder }]}>
                  <Text style={[styles.subredditPrefix, { color: c.textSecondary }]}>r/</Text>
                  <TextInput
                    style={[styles.subredditInput, { color: c.textPrimary }]}
                    value={form.subreddit}
                    onChangeText={(value) => {
                      const cleaned = value.replace(/^\/?r\//i, '').replace(/[^a-zA-Z0-9_]/g, '');
                      setForm(prev => ({
                        ...prev,
                        subreddit: cleaned,
                        name: cleaned ? `r/${cleaned}` : 'Reddit'
                      }));
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="supplychain"
                    placeholderTextColor={c.placeholder}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {form.needsUrl && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>RSS / Atom feed URL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingUrl ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                  value={form.sourceUrl}
                  onChangeText={(value) => updateForm({ sourceUrl: value })}
                  placeholder="https://example.com/rss"
                  placeholderTextColor={c.placeholder}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            )}

            {form.needsApiKey && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>API Key / Token</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingApiKey ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                  value={form.apiKey}
                  onChangeText={(value) => updateForm({ apiKey: value })}
                  placeholder="Enter API key"
                  placeholderTextColor={c.placeholder}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: c.surfaceBorder }]}>
            {!canSave && (
              <View style={styles.validationRow}>
                <Feather name="alert-circle" size={14} color={c.warning} />
                <Text style={[styles.validationText, { color: c.warning }]}>
                  Please fill in all required fields.
                </Text>
              </View>
            )}
            {validationError && (
              <View style={styles.validationRow}>
                <Feather name="alert-circle" size={14} color={c.error} />
                <Text style={[styles.validationText, { color: c.error }]}>
                  {validationError}
                </Text>
              </View>
            )}
            <View style={styles.footerActions}>
              {onDelete && (
                <TouchableOpacity style={[styles.deleteButton, { borderColor: c.error }]} onPress={() => onDelete(form.id)} disabled={isValidating}>
                  <Text style={[styles.deleteText, { color: c.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: (canSave && !isValidating) ? c.accent : c.surfaceVariant }]}
                onPress={save}
                disabled={!canSave || isValidating}
              >
                <Feather name={isValidating ? 'loader' : 'check'} size={16} color={c.white} />
                <Text style={[styles.modalSaveBtnText, { color: c.white }]}>
                  {isValidating ? 'Verifying...' : saveLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function NewsAggregatorModal({
  visible,
  newsSources = EMPTY_ARRAY,
  selectedAggregators = EMPTY_ARRAY,
  apiKeys = EMPTY_OBJECT,
  businessKeywords = EMPTY_ARRAY,
  onClose,
  onApply,
  title = 'Add News Source',
  description = 'Choose one source to configure. Already added sources stay hidden here.',
  saveLabel = 'Add Source',
}) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const normalizedSources = useMemo(() => {
    const sources = Array.isArray(newsSources)
      ? newsSources
      : aggregatorSetupToNewsSources({ selectedAggregators, apiKeys, businessKeywords });
    return sources.map(normalizeNewsSource);
  }, [apiKeys, businessKeywords, newsSources, selectedAggregators]);
  const [pendingSource, setPendingSource] = useState(null);

  useEffect(() => {
    if (!visible) setPendingSource(null);
  }, [visible]);

  const addedTypes = useMemo(() => new Set(
    normalizedSources
      .filter(source => !source.custom && !source.allowMultiple)
      .map(source => source.type)
  ), [normalizedSources]);

  const availableOptions = useMemo(() => (
    AGGREGATOR_OPTIONS.filter(option => option.custom || option.allowMultiple || !addedTypes.has(option.type))
  ), [addedTypes]);

  const categories = useMemo(() => (
    [...new Set(availableOptions.map(item => item.category))]
  ), [availableOptions]);

  const addSource = (source) => {
    applySetup([...normalizedSources.map(sourceForStorage), sourceForStorage(source)], onApply);
    setPendingSource(null);
    onClose?.();
  };

  return (
    <>
      <Modal visible={visible && !pendingSource} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: c.textPrimary }]}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
                {description}
              </Text>

              {availableOptions.length ? (
                categories.map(category => (
                  <View key={category} style={styles.categoryBlock}>
                    <Text style={[styles.catHeader, { color: c.textSecondary }]}>{category}</Text>
                    {availableOptions.filter(item => item.category === category).map(option => (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionRow, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}
                        onPress={() => {
                          const needsSetup = option.needsUrl || option.needsApiKey || option.needsSubreddit;
                          if (needsSetup) {
                            setPendingSource(createNewsSourceFromOption(option));
                          } else {
                            addSource(createNewsSourceFromOption(option));
                          }
                        }}
                      >
                        <View style={styles.optionIcon}>
                          <BrandIcon type={option.type} name={option.name} size={18} enabled={true} />
                        </View>
                        <View style={styles.optionTextBlock}>
                          <Text style={[styles.optionName, { color: c.textPrimary }]}>{option.name}</Text>
                        </View>
                        <Feather name="plus-circle" size={19} color={c.accent} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}>
                  <Feather name="check-circle" size={18} color={c.success} />
                  <Text style={[styles.emptyText, { color: c.textSecondary }]}>All built-in sources already added.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NewsSourceDetailModal
        visible={!!pendingSource}
        source={pendingSource}
        onClose={() => setPendingSource(null)}
        onSave={addSource}
        saveLabel={saveLabel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  subredditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  subredditPrefix: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginRight: 4,
  },
  subredditInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    paddingVertical: 0,
    height: '100%',
  },
  sourceHeaderCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  sourceHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceHeaderText: {
    flex: 1,
  },
  sourceHeaderName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  sourceHeaderCategory: {
    fontSize: FontSizes.xs,
    marginTop: 1,
    fontWeight: FontWeights.medium,
  },
  sourceHeaderDesc: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalDesc: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  categoryBlock: {
    marginTop: 12,
  },
  catHeader: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  optionDesc: {
    fontSize: FontSizes.xs,
    marginTop: 2,
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
    gap: 12,
  },
  toggleTextBlock: {
    flex: 1,
  },
  fieldTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  fieldHint: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSizes.sm,
  },
  keywordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 12,
    overflow: 'hidden',
  },
  keywordInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    paddingVertical: 9,
  },
  keywordAddButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keywordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 9,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: FontSizes.sm,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  validationText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  deleteText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  modalSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalSaveBtnText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
