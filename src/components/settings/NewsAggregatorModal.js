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
import { usePreferences } from '../../context/PreferencesContext';
import { FontSizes, FontWeights } from '../../constants/typography';

export const AGGREGATOR_OPTIONS = [
  { id: 'google_news', type: 'google_news', name: 'Google News', icon: 'globe', desc: 'Google News RSS feeds', category: 'International', defaultUrl: 'https://news.google.com/rss/search?q=fuel+logistics+pakistan' },
  { id: 'newsapi', type: 'newsapi', name: 'NewsAPI', icon: 'server', desc: 'newsapi.org API key required', category: 'International', needsKey: true },
  { id: 'bing_news', type: 'bing_news', name: 'Bing News', icon: 'search', desc: 'Microsoft Bing News API key required', category: 'International', needsKey: true },
  { id: 'reddit', type: 'reddit', name: 'Reddit', icon: 'message-circle', desc: 'Subreddit feeds', category: 'International' },
  { id: 'hackernews', type: 'hackernews', name: 'Hacker News', icon: 'terminal', desc: 'YC Hacker News top stories', category: 'International' },
  { id: 'dawn', type: 'dawn', name: 'Dawn News', icon: 'file-text', desc: 'dawn.com RSS', category: 'Pakistan' },
  { id: 'geo', type: 'geo', name: 'Geo News', icon: 'file-text', desc: 'geo.tv RSS', category: 'Pakistan' },
  { id: 'express_tribune', type: 'express_tribune', name: 'Express Tribune', icon: 'file-text', desc: 'tribune.com.pk RSS', category: 'Pakistan' },
  { id: 'ary', type: 'ary', name: 'ARY News', icon: 'file-text', desc: 'arynews.tv RSS', category: 'Pakistan' },
  { id: 'business_recorder', type: 'business_recorder', name: 'Business Recorder', icon: 'trending-up', desc: 'brecorder.com RSS', category: 'Pakistan' },
  { id: 'custom_rss', type: 'custom_rss', name: 'Custom RSS', icon: 'rss', desc: 'Add any RSS / Atom feed URL', category: 'Custom', needsUrl: true, custom: true },
  { id: 'custom_api', type: 'custom_api', name: 'Custom News API', icon: 'database', desc: 'Add API endpoint and optional key', category: 'Custom', needsUrl: true, acceptsKey: true, custom: true },
];

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const createLocalId = () => `news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const uniqueList = (items) => [...new Set((items || []).map(item => String(item).trim()).filter(Boolean))];
const getOptionByType = (type) => AGGREGATOR_OPTIONS.find(option => option.type === type || option.id === type);

export const normalizeNewsSource = (source = {}) => {
  const option = getOptionByType(source.type) || getOptionByType(source.templateId);
  const custom = source.custom === true || option?.custom === true || !option;
  const type = source.type || option?.type || (source.needsKey ? 'custom_api' : 'custom_rss');

  return {
    id: source.id || createLocalId(),
    name: source.name || option?.name || 'Custom Source',
    type,
    sourceUrl: source.sourceUrl || option?.defaultUrl || '',
    apiKey: source.apiKey || '',
    keywords: uniqueList(source.keywords),
    enabled: source.enabled !== false,
    custom,
    needsUrl: source.needsUrl === true || option?.needsUrl === true || type === 'custom_rss' || type === 'custom_api',
    needsKey: source.needsKey === true || option?.needsKey === true,
    acceptsKey: source.acceptsKey === true || option?.acceptsKey === true || option?.needsKey === true || !!source.apiKey,
    icon: source.icon || option?.icon || (custom ? 'rss' : 'globe'),
    desc: source.desc || option?.desc || source.sourceUrl || 'Configured source',
    category: source.category || option?.category || 'Configured',
    keywordDraft: '',
  };
};

export const sourceForStorage = (source) => ({
  id: source.id || createLocalId(),
  name: String(source.name || '').trim() || 'Untitled Source',
  type: source.type || 'custom_rss',
  sourceUrl: String(source.sourceUrl || '').trim(),
  apiKey: String(source.apiKey || '').trim(),
  keywords: uniqueList(source.keywords),
  enabled: source.enabled !== false,
  custom: source.custom === true,
  needsUrl: source.needsUrl === true,
  needsKey: source.needsKey === true,
  acceptsKey: source.acceptsKey === true,
});

export const createNewsSourceFromOption = (option) => normalizeNewsSource({
  id: createLocalId(),
  name: option.name,
  type: option.type,
  sourceUrl: option.defaultUrl || '',
  keywords: [],
  enabled: true,
  custom: option.custom === true,
  needsUrl: option.needsUrl === true,
  needsKey: option.needsKey === true,
  acceptsKey: option.acceptsKey === true || option.needsKey === true,
});

export const newsSourcesToAggregatorSetup = (sources = []) => {
  const normalizedSources = sources.map(normalizeNewsSource);
  const enabledSources = normalizedSources.filter(source => source.enabled !== false);

  return {
    selectedAggregators: enabledSources.map(source => ({
      id: source.id,
      name: source.name,
      icon: source.icon,
      desc: source.sourceUrl || source.desc,
      category: source.category,
      type: source.type,
      keywords: source.keywords,
    })),
    apiKeys: enabledSources.reduce((acc, source) => {
      if (source.apiKey) acc[source.id] = source.apiKey;
      if (source.sourceUrl) acc[`${source.id}_url`] = source.sourceUrl;
      return acc;
    }, {}),
    businessKeywords: uniqueList(enabledSources.flatMap(source => source.keywords)),
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
    apiKey: apiKeys[aggregator.id] || '',
    keywords: businessKeywords,
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

  useEffect(() => {
    if (!visible || !source) return;
    setForm(normalizeNewsSource(source));
  }, [source, visible]);

  if (!form) return null;

  const sourceEnabled = form.enabled !== false;
  const missingName = sourceEnabled && !String(form.name || '').trim();
  const missingUrl = sourceEnabled && form.needsUrl && !String(form.sourceUrl || '').trim();
  const missingKey = sourceEnabled && form.needsKey && !String(form.apiKey || '').trim();
  const canSave = !(missingName || missingUrl || missingKey);

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }));

  const addKeyword = () => {
    const keyword = String(form.keywordDraft || '').trim();
    if (!keyword || form.keywords.includes(keyword)) return;
    updateForm({ keywords: [...form.keywords, keyword], keywordDraft: '' });
  };

  const removeKeyword = (keyword) => {
    updateForm({ keywords: form.keywords.filter(item => item !== keyword) });
  };

  const save = () => {
    if (!canSave) return;
    onSave?.(sourceForStorage(form));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHead, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>{form.name || 'News Source'}</Text>
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

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Source name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingName ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                value={form.name}
                onChangeText={(value) => updateForm({ name: value })}
                placeholder="Source name"
                placeholderTextColor={c.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                {form.needsUrl ? 'URL / feed / endpoint' : 'URL / feed / endpoint (optional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingUrl ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                value={form.sourceUrl}
                onChangeText={(value) => updateForm({ sourceUrl: value })}
                placeholder="https://example.com/rss or API endpoint"
                placeholderTextColor={c.placeholder}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {(form.needsKey || form.acceptsKey || form.apiKey) && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                  {form.needsKey ? 'API key' : 'API key (optional)'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: missingKey ? c.warning : c.surfaceBorder, color: c.textPrimary }]}
                  value={form.apiKey}
                  onChangeText={(value) => updateForm({ apiKey: value })}
                  placeholder="Paste source API key"
                  placeholderTextColor={c.placeholder}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Keywords for this source</Text>
              <View style={[styles.keywordInputRow, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}>
                <TextInput
                  style={[styles.keywordInput, { color: c.textPrimary }]}
                  value={form.keywordDraft}
                  onChangeText={(value) => updateForm({ keywordDraft: value })}
                  placeholder="fuel, logistics, policy..."
                  placeholderTextColor={c.placeholder}
                  onSubmitEditing={addKeyword}
                  returnKeyType="done"
                />
                <TouchableOpacity style={[styles.keywordAddButton, { backgroundColor: c.accent }]} onPress={addKeyword}>
                  <Feather name="plus" size={15} color={c.white} />
                </TouchableOpacity>
              </View>
              {form.keywords.length > 0 && (
                <View style={styles.keywordChips}>
                  {form.keywords.map(keyword => (
                    <TouchableOpacity
                      key={keyword}
                      style={[styles.chip, { backgroundColor: c.accentSoft }]}
                      onPress={() => removeKeyword(keyword)}
                    >
                      <Text style={[styles.chipText, { color: c.accent }]}>{keyword}</Text>
                      <Feather name="x" size={12} color={c.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: c.surfaceBorder }]}>
            {!canSave && (
              <View style={styles.validationRow}>
                <Feather name="alert-circle" size={14} color={c.warning} />
                <Text style={[styles.validationText, { color: c.warning }]}>
                  Add required name, URL, or API key.
                </Text>
              </View>
            )}
            <View style={styles.footerActions}>
              {onDelete && (
                <TouchableOpacity style={[styles.deleteButton, { borderColor: c.error }]} onPress={() => onDelete(form.id)}>
                  <Text style={[styles.deleteText, { color: c.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: canSave ? c.accent : c.surfaceVariant }]}
                onPress={save}
                disabled={!canSave}
              >
                <Feather name="check" size={16} color={c.white} />
                <Text style={[styles.modalSaveBtnText, { color: c.white }]}>{saveLabel}</Text>
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
      .filter(source => !source.custom)
      .map(source => source.type)
  ), [normalizedSources]);

  const availableOptions = useMemo(() => (
    AGGREGATOR_OPTIONS.filter(option => option.custom || !addedTypes.has(option.type))
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
                        onPress={() => setPendingSource(createNewsSourceFromOption(option))}
                      >
                        <View style={[styles.optionIcon, { backgroundColor: c.surfaceVariant }]}>
                          <Feather name={option.icon} size={17} color={c.textSecondary} />
                        </View>
                        <View style={styles.optionTextBlock}>
                          <Text style={[styles.optionName, { color: c.textPrimary }]}>{option.name}</Text>
                          <Text style={[styles.optionDesc, { color: c.textSecondary }]}>{option.desc}</Text>
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
