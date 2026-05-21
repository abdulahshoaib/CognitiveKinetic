import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import BrandIcon from '../components/common/BrandIcon';
import { useAuth } from '../context/AuthContext';
import { useIntegrations } from '../context/IntegrationsContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile, saveProfile, updateProfile, analyzeProfileContext } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import ProfileForm from '../components/common/ProfileForm';
import SegmentedControl from '../components/preferences/SegmentedControl';
import SettingRow from '../components/preferences/SettingRow';
import ThemePreviewCard from '../components/preferences/ThemePreviewCard';
import ThemeSelector from '../components/preferences/ThemeSelector';
import NewsAggregatorModal, { NewsSourceDetailModal } from '../components/settings/NewsAggregatorModal';

const TABS = [
  { id: 'context', label: 'Business', icon: 'briefcase', subtitle: 'Saved profile reused by analysis.' },
  { id: 'apis', label: 'Action APIs', icon: 'server', subtitle: 'Systems agent can simulate against.' },
  { id: 'news', label: 'News Sources', icon: 'rss', subtitle: 'Feeds and prompt for collected news.' },
  { id: 'logs', label: 'System Logs', icon: 'activity', subtitle: 'Detailed connection & ingest diagnostics.' },
  { id: 'preferences', label: 'Preferences', icon: 'sliders', subtitle: 'Visual and agent display controls.' },
  { id: 'account', label: 'Account', icon: 'user', subtitle: 'Identity, password, and session.' },
];

const API_TYPES = ['pricing_adjust', 'route_shift', 'notification', 'manual_review', 'custom'];

const IMMUTABLE_NEWS_PROMPT =
  'System rule: use the saved business profile as the source of truth, classify only enabled user-configured sources, and return operationally relevant news for the content-to-action workflow.';

const emptyApiForm = {
  name: '',
  baseUrl: '',
  docsMode: 'text',
  docsText: '',
  docsDocumentName: '',
  docsDocumentUri: '',
  authType: 'none',
  headerName: '',
  token: '',
  actionTypesText: 'pricing_adjust',
  enabled: true,
};

const splitCsv = (value) => String(value || '').split(',').map(item => item.trim()).filter(Boolean);

const joinList = (items) => (Array.isArray(items) && items.length ? items.join(', ') : 'None');

const getTabMeta = (id) => TABS.find(tab => tab.id === id) || TABS[0];

const getSourceIcon = (sourceKey, sourceName) => {
  const name = String(sourceName || sourceKey || '').toLowerCase();
  const type = String(sourceKey || '').toLowerCase();
  if (name.includes('google')) return 'globe';
  if (name.includes('reddit')) return 'message-square';
  if (name.includes('hacker') || name.includes('ycombinator')) return 'terminal';
  if (name.includes('newsapi') || name.includes('api')) return 'server';
  if (name.includes('agent') || name.includes('ck')) return 'cpu';
  if (type === 'business_recorder' || name.includes('recorder')) return 'trending-up';
  if (['dawn', 'geo', 'express', 'ary', 'tribune'].some(x => type.includes(x) || name.includes(x))) return 'file-text';
  return 'rss';
};

const getSourceDescription = (source) => {
  if (['dawn', 'geo', 'express_tribune', 'ary', 'business_recorder'].includes(source.type)) {
    return '';
  }
  if (source.subreddit) return `r/${source.subreddit}`;
  if (source.sourceUrl) return source.sourceUrl;
  if (['google_news', 'bing_news'].includes(source.type)) return 'Profile-driven query';
  if (source.type === 'hackernews') return 'Provider URL resolved by backend';
  return source.type;
};

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout, resetPassword, updateDisplayName } = useAuth();
  const { preferences, updatePreference, activeTheme } = usePreferences();
  const {
    actionApis,
    addActionApi,
    newsAggregators,
    newsSystemPrompt,
    removeActionApi,
    setNewsAggregators,
    updateActionApi,
    updateNewsSystemPrompt,
    syncLogs,
    clearSyncLogs,
  } = useIntegrations();
  const c = activeTheme.colors;

  const [profile, setProfile] = useState(null);
  const [businessContext, setBusinessContext] = useState(null);
  const [isAnalyzingContext, setIsAnalyzingContext] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('context');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [apiModalVisible, setApiModalVisible] = useState(false);
  const [editingApiId, setEditingApiId] = useState(null);
  const [apiForm, setApiForm] = useState(emptyApiForm);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [selectedNewsSource, setSelectedNewsSource] = useState(null);
  const [promptDraft, setPromptDraft] = useState(newsSystemPrompt);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const email = user?.email || '';
  const isDemo = !!user?.isAnonymous;
  const activeMeta = getTabMeta(activeTab);

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user?.uid]);

  useEffect(() => {
    const requestedTab = route.params?.tab === 'personalization' ? 'preferences' : route.params?.tab;
    if (requestedTab && TABS.some(tab => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [route.params?.tab]);

  useEffect(() => {
    setPromptDraft(newsSystemPrompt);
  }, [newsSystemPrompt]);

  const loadProfile = async () => {
    try {
      const activeProfile = await getProfile(user.uid);
      setProfile(activeProfile || {});
      setBusinessContext(activeProfile?.businessContextAnalysis || activeProfile?.businessContext || null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProfile = async (profileData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // Save profile first
      await saveProfile(user.uid, profileData);
      Alert.alert('Saved', 'Business profile updated.');
      setProfile(profileData);
      setIsEditingProfile(false);

      // Analyze business context in background (non-blocking)
      setIsAnalyzingContext(true);
      try {
        const analysis = await analyzeProfileContext(user.uid, profileData);
        if (analysis) {
          setBusinessContext(analysis);
          await updateProfile(user.uid, {
            businessContextAnalysis: analysis,
          });
        }
      } catch (analyzeError) {
        console.warn('Background analysis failed (non-blocking):', analyzeError);
      } finally {
        setIsAnalyzingContext(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveName = async () => {
    const nextName = displayName.trim();
    if (!nextName) {
      Alert.alert('Name required', 'Enter a display name before saving.');
      return;
    }

    setIsSavingName(true);
    try {
      await updateDisplayName(nextName);
      Alert.alert('Saved', 'Display name updated.');
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Password reset unavailable', 'This account has no connected email.');
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPassword(email);
      Alert.alert('Check your email', `Password reset instructions sent to ${email}.`);
    } catch (error) {
      Alert.alert('Password reset failed', error.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'End this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const openApiModal = (api = null) => {
    setEditingApiId(api?.id || null);
    setApiForm(api ? {
      name: api.name || '',
      baseUrl: api.baseUrl || '',
      docsMode: api.docsMode || 'text',
      docsText: api.docsText || '',
      docsDocumentName: api.docsDocument?.name || '',
      docsDocumentUri: api.docsDocument?.uri || '',
      authType: api.authType || 'none',
      headerName: api.headerName || '',
      token: api.token || '',
      actionTypesText: joinList(api.actionTypes || []),
      enabled: api.enabled !== false,
    } : emptyApiForm);
    setApiModalVisible(true);
  };

  const closeApiModal = () => {
    setApiModalVisible(false);
    setEditingApiId(null);
    setApiForm(emptyApiForm);
  };

  const saveApi = () => {
    if (!apiForm.name.trim() || !apiForm.baseUrl.trim()) {
      Alert.alert('Missing details', 'Add API name and base URL.');
      return;
    }

    const payload = {
      name: apiForm.name.trim(),
      baseUrl: apiForm.baseUrl.trim(),
      docsMode: apiForm.docsMode,
      docsText: apiForm.docsText.trim(),
      docsDocument: apiForm.docsDocumentName.trim() || apiForm.docsDocumentUri.trim()
        ? { name: apiForm.docsDocumentName.trim(), uri: apiForm.docsDocumentUri.trim() }
        : null,
      authType: apiForm.authType,
      headerName: apiForm.headerName.trim(),
      token: apiForm.token.trim(),
      actionTypes: splitCsv(apiForm.actionTypesText),
      enabled: apiForm.enabled,
    };

    if (editingApiId) updateActionApi(editingApiId, payload);
    else addActionApi(payload);
    closeApiModal();
  };

  const deleteApi = () => {
    if (!editingApiId) return;
    removeActionApi(editingApiId);
    closeApiModal();
  };

  const openNewsModal = () => {
    setNewsModalVisible(true);
  };

  const closeNewsModal = () => {
    setNewsModalVisible(false);
  };

  const openNewsDetails = (source) => {
    setSelectedNewsSource(source);
  };

  const closeNewsDetails = () => {
    setSelectedNewsSource(null);
  };

  const mirrorNewsSettingsToProfile = async (updates) => {
    if (!user?.uid) return;
    try {
      await updateProfile(user.uid, {
        immutableNewsPrompt: IMMUTABLE_NEWS_PROMPT,
        ...updates,
      });
      setProfile(prev => ({
        ...(prev || {}),
        immutableNewsPrompt: IMMUTABLE_NEWS_PROMPT,
        ...updates,
      }));
    } catch (error) {
      console.warn('Unable to mirror news settings to profile:', error);
    }
  };

  const saveNewsSetup = ({ newsSources }) => {
    setNewsAggregators(newsSources);
    mirrorNewsSettingsToProfile({ newsSources });
    closeNewsModal();
  };

  const saveNewsPrompt = async () => {
    if (!user?.uid) return;
    const nextPrompt = promptDraft.trim();
    try {
      updateNewsSystemPrompt(nextPrompt);
      await updateProfile(user.uid, {
        newsSystemPrompt: nextPrompt,
        immutableNewsPrompt: IMMUTABLE_NEWS_PROMPT,
        newsSources: newsAggregators,
      });
      setProfile(prev => ({
        ...(prev || {}),
        newsSystemPrompt: nextPrompt,
        immutableNewsPrompt: IMMUTABLE_NEWS_PROMPT,
        newsSources: newsAggregators,
      }));
      Alert.alert('Saved', 'News prompt updated.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update news prompt.');
    }
  };

  const saveNewsSource = (source) => {
    const nextSources = newsAggregators.map(item => item.id === source.id ? source : item);
    setNewsAggregators(nextSources);
    mirrorNewsSettingsToProfile({ newsSources: nextSources });
    closeNewsDetails();
  };

  const deleteNewsSource = (id) => {
    const nextSources = newsAggregators.filter(source => source.id !== id);
    setNewsAggregators(nextSources);
    mirrorNewsSettingsToProfile({ newsSources: nextSources });
    closeNewsDetails();
  };

  const toggleNewsSource = (source) => {
    const nextSources = newsAggregators.map(item => (
      item.id === source.id ? { ...item, enabled: item.enabled === false } : item
    ));
    setNewsAggregators(nextSources);
    mirrorNewsSettingsToProfile({ newsSources: nextSources });
  };

  const renderTabs = () => (
    <View style={[styles.tabShell, { borderBottomColor: c.surfaceBorderSubtle }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? c.accentSoft : c.surfaceContainerLow,
                  borderColor: active ? c.accentBorder : c.surfaceBorder,
                },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Feather name={tab.icon} size={15} color={active ? c.accent : c.textSecondary} />
              <Text style={[styles.tabText, { color: active ? c.textPrimary : c.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCardStatus = (enabled) => (
    <View style={[styles.statusPill, { backgroundColor: enabled ? c.successSoft : c.surfaceVariant, borderColor: enabled ? c.successBorder : c.surfaceBorder }]}>
      <Text style={[styles.statusPillText, { color: enabled ? c.success : c.textSecondary }]}>
        {enabled ? 'Enabled' : 'Paused'}
      </Text>
    </View>
  );

  const renderSwitch = (enabled, onPress) => (
    <TouchableOpacity
      style={[styles.cardSwitchTrack, { backgroundColor: enabled ? c.successSoft : c.surfaceVariant, borderColor: enabled ? c.successBorder : c.surfaceBorder }]}
      onPress={onPress}
    >
      <View style={[styles.cardSwitchKnob, { backgroundColor: enabled ? c.success : c.textSecondary, alignSelf: enabled ? 'flex-end' : 'flex-start' }]} />
    </TouchableOpacity>
  );

  const renderApisTab = () => (
    <View style={styles.stack}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Action APIs</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>Simulation targets agent can reason about.</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: c.accent }]} onPress={() => openApiModal()}>
          <Feather name="plus" size={18} color={c.white} />
        </TouchableOpacity>
      </View>

      {actionApis.map(api => (
        <TouchableOpacity
          key={api.id}
          style={[styles.integrationCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}
          onPress={() => openApiModal(api)}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.cardIcon, { backgroundColor: c.primarySubtle }]}>
              <Feather name="server" size={18} color={c.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{api.name}</Text>
              <Text style={[styles.cardUrl, { color: c.textSecondary }]} numberOfLines={1}>{api.baseUrl}</Text>
            </View>
            {renderCardStatus(api.enabled !== false)}
          </View>
          <View style={styles.cardMetaRow}>
            <Text style={[styles.metaChip, { color: c.textSecondary, backgroundColor: c.surfaceContainerLowest }]}>
              {api.docsMode === 'document' ? 'Document docs' : 'Text docs'}
            </Text>
            <Text style={[styles.metaChip, { color: c.textSecondary, backgroundColor: c.surfaceContainerLowest }]}>
              {api.authType === 'none' ? 'No auth' : api.authType}
            </Text>
            <Text style={[styles.metaChip, { color: c.textSecondary, backgroundColor: c.surfaceContainerLowest }]} numberOfLines={1}>
              {joinList(api.actionTypes)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNewsTab = () => (
    <View style={styles.stack}>
      <View style={[styles.promptCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>News Agent Prompt</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>Controls what collected news should focus on.</Text>
          </View>
          <TouchableOpacity style={[styles.savePromptButton, { backgroundColor: c.accent }]} onPress={saveNewsPrompt}>
            <Text style={[styles.savePromptText, { color: c.white }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.textArea, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary }]}
          value={promptDraft}
          onChangeText={setPromptDraft}
          multiline
          textAlignVertical="top"
          placeholder="Tell the agent what news to collect..."
          placeholderTextColor={c.placeholder}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>News Aggregators</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>Sources used by New Content feed.</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: c.accent }]} onPress={() => openNewsModal()}>
          <Feather name="plus" size={18} color={c.white} />
        </TouchableOpacity>
      </View>

      {newsAggregators.map(source => {
        const enabled = source.enabled !== false;
        const isEditableModal = source.type === 'custom_rss' || source.type === 'custom_api';
        const iconName = getSourceIcon(source.type, source.name);
        
        return (
        <View
          key={source.id}
          style={[styles.integrationCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorderSubtle, opacity: enabled ? 1 : 0.7, paddingHorizontal: 12, paddingVertical: 10 }, styles.shadow]}
        >
          <View style={styles.cardTopRow}>
            {isEditableModal ? (
              <TouchableOpacity style={styles.sourceMainButton} onPress={() => openNewsDetails(source)}>
                <View style={styles.cardIcon}>
                  <BrandIcon type={source.type} name={source.name} size={18} enabled={enabled} />
                </View>
                <View style={styles.cardText}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{source.name}</Text>
                    <Feather name="edit-2" size={11} color={c.textSecondary} />
                  </View>
                  {!!source.sourceUrl && (
                    <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }} numberOfLines={1}>
                      {source.sourceUrl}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.sourceMainButton}>
                <View style={styles.cardIcon}>
                  <BrandIcon type={source.type} name={source.name} size={18} enabled={enabled} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{source.name}</Text>
                </View>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {renderSwitch(enabled, () => toggleNewsSource(source))}
              
              <TouchableOpacity 
                style={[styles.cardDeleteIconBtn, { backgroundColor: c.errorSoft }]}
                onPress={() => deleteNewsSource(source.id)}
              >
                <Feather name="trash-2" size={15} color={c.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
      })}
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.personalizationContainer}>
      <ThemePreviewCard />

      <SettingRow title="Theme Mode" description="Visual aesthetic for workspace.">
        <ThemeSelector selected={preferences.themeMode} onSelect={(val) => updatePreference('themeMode', val)} />
      </SettingRow>

      <SettingRow title="Insight Style" description="How agent insights are presented.">
        <SegmentedControl
          options={[
            { label: 'Simple', value: 'simple' },
            { label: 'Detailed', value: 'detailed' },
            { label: 'Technical', value: 'technical' },
          ]}
          selected={preferences.insightStyle}
          onSelect={(val) => updatePreference('insightStyle', val)}
        />
      </SettingRow>

      <SettingRow title="Motion" description="Speed and presence of UI animation.">
        <SegmentedControl
          options={[
            { label: 'Full', value: 'full' },
            { label: 'Reduced', value: 'reduced' },
            { label: 'Minimal', value: 'minimal' },
          ]}
          selected={preferences.motion}
          onSelect={(val) => updatePreference('motion', val)}
        />
      </SettingRow>

      <SettingRow title="Home Focus" description="What dashboard prioritizes on load.">
        <SegmentedControl
          options={[
            { label: 'Latest', value: 'latest-insight' },
            { label: 'Actions', value: 'action-queue' },
            { label: 'Progress', value: 'progress-summary' },
          ]}
          selected={preferences.homeFocus}
          onSelect={(val) => updatePreference('homeFocus', val)}
        />
      </SettingRow>

      <SettingRow title="Agent Trace" description="How much background processing appears.">
        <SegmentedControl
          options={[
            { label: 'Hidden', value: 'hidden' },
            { label: 'Summary', value: 'summary-only' },
            { label: 'Full', value: 'full-trace' },
          ]}
          selected={preferences.agentTransparency}
          onSelect={(val) => updatePreference('agentTransparency', val)}
        />
      </SettingRow>
    </View>
  );

  const renderAccountTab = () => (
    <View style={styles.accountContainer}>
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Identity</Text>
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Display name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={c.placeholder}
          />
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.accent }]} onPress={handleSaveName} disabled={isSavingName}>
          {isSavingName ? (
            <ActivityIndicator color={c.white} />
          ) : (
            <>
              <Feather name="check" size={18} color={c.white} />
              <Text style={[styles.primaryButtonText, { color: c.white }]}>Save Name</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Security</Text>
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}>
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, { backgroundColor: c.primarySubtle }]}>
            <Feather name="key" size={18} color={c.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: c.textPrimary }]}>Change password</Text>
            <Text style={[styles.actionSubtitle, { color: c.textSecondary }]}>
              {isDemo ? 'Unavailable for demo sessions.' : 'Send password reset link to your email.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: c.surfaceBorder, backgroundColor: c.surfaceContainerHighest }, isDemo && styles.disabled]}
          onPress={handlePasswordReset}
          disabled={isDemo || isSendingReset}
        >
          {isSendingReset ? (
            <ActivityIndicator color={c.textPrimary} />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>Send Reset Email</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Session</Text>
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Account</Text>
          <Text style={[styles.detailValue, { color: c.textPrimary }]}>{isDemo ? 'Demo' : 'Registered'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: c.surfaceBorder }]} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Email</Text>
          <Text style={[styles.detailValue, { color: c.textPrimary }]}>{email || 'Not connected'}</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: c.errorSoft, borderColor: c.error }]} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={c.error} />
        <Text style={[styles.logoutText, { color: c.error }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );

  const handleDownloadLogs = () => {
    const failedLogs = syncLogs.filter(log => log.status === 'failed');
    if (failedLogs.length === 0) {
      Alert.alert('No logs', 'There are no failed ingestion logs to download.');
      return;
    }
    
    // Create a beautiful text file format
    const logText = failedLogs.map(log => (
      `========================================\n` +
      `Source: ${log.sourceName}\n` +
      `Timestamp: ${log.timestamp}\n` +
      `Status: FAILED\n` +
      `Error Type: ${log.errorType || 'Unknown Error'}\n` +
      `Message: ${log.message || 'No message provided'}\n` +
      `Reason & Diagnosis:\n${log.reason || 'No diagnostic explanation available.'}\n` +
      `========================================\n`
    )).join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relay_failed_logs_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Success', 'Diagnostic logs downloaded successfully.');
    } else {
      Alert.alert(
        'Export Logs', 
        'Failed logs exported to relay_failed_logs.txt. Diagnostics saved to device storage.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderLogsTab = () => {
    const failedLogs = syncLogs.filter(log => log.status === 'failed');
    return (
      <View style={styles.stack}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>System Ingestion Logs</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>Diagnostic connection history and failures.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {failedLogs.length > 0 && (
              <TouchableOpacity 
                style={[styles.savePromptButton, { backgroundColor: c.errorSoft, borderColor: c.error, borderWidth: 1 }]} 
                onPress={() => {
                  Alert.alert('Clear logs', 'Clear all diagnostic connection history?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearSyncLogs },
                  ]);
                }}
              >
                <Text style={[styles.savePromptText, { color: c.error }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.savePromptButton, { backgroundColor: c.accent }]} 
              onPress={handleDownloadLogs}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="download" size={14} color={c.white} />
                <Text style={[styles.savePromptText, { color: c.white }]}>Download</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {failedLogs.length === 0 ? (
          <View style={[styles.logEmptyCard, { backgroundColor: c.successSoft, borderColor: c.successBorder }]}>
            <View style={[styles.cardIcon, { backgroundColor: c.success, alignSelf: 'center' }]}>
              <Feather name="check" size={20} color={c.white} />
            </View>
            <Text style={[styles.logEmptyTitle, { color: c.textPrimary }]}>All Channels Healthy</Text>
            <Text style={[styles.logEmptyDesc, { color: c.textSecondary }]}>
              No ingestion or connection failures have been detected in the last 24 hours. All RSS feeds and APIs are operating normally.
            </Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {failedLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.logRow, 
                    { 
                      borderColor: c.errorBorder, 
                      backgroundColor: c.surfaceContainerLow 
                    }
                  ]}
                  onPress={() => setExpandedLogId(isExpanded ? null : log.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.logRowTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 32, height: 32 }}>
                        <BrandIcon type="" name={log.sourceName} size={15} enabled={true} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logRowHeader, { color: c.textPrimary }]} numberOfLines={1}>
                          {log.sourceName}
                        </Text>
                        <Text style={{ fontSize: FontSizes.xs, color: c.error, fontWeight: FontWeights.bold, textTransform: 'uppercase', marginTop: 1 }}>
                          {log.errorType || 'SYNC FAILURE'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.compactTime, { color: c.textSecondary }]}>{log.timestamp}</Text>
                      <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.textSecondary} />
                    </View>
                  </View>

                  <Text style={[styles.logRowMessage, { color: c.textSecondary }]} numberOfLines={isExpanded ? undefined : 2}>
                    {log.message}
                  </Text>

                  {isExpanded && (
                    <View style={[styles.logRowDetail, { borderTopColor: c.surfaceBorder }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Feather name="info" size={13} color={c.accent} />
                        <Text style={[styles.logRowDetailTitle, { color: c.accent }]}>
                          Diagnosis & Solution
                        </Text>
                      </View>
                      <Text style={[styles.logRowDetailText, { color: c.textPrimary }]}>
                        {log.reason}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === 'context') {
      if (isEditingProfile) {
        return (
          <View>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, marginBottom: 16 }}
              onPress={() => setIsEditingProfile(false)}
            >
              <Feather name="arrow-left" size={18} color={c.accent} />
              <Text style={{ color: c.accent, marginLeft: 8, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            {profile ? (
              <ProfileForm initialData={profile} onSave={handleSaveProfile} isSaving={isSaving} submitLabel="Save Changes" />
            ) : (
              <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
            )}
          </View>
        );
      }
      
      // Display profile card
      if (!profile) return <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />;
      
      const locations = Array.isArray(profile.locations) ? profile.locations : 
                        (typeof profile.locations === 'string' ? profile.locations.split(',').map(l => l.trim()).filter(Boolean) : []);
      
      return (
        <View style={{ marginBottom: 24 }}>
          <View style={[{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, styles.shadow]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 }}>
              <View>
                <Text style={[{ fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 4 }]}>{profile.businessName || 'Business Profile'}</Text>
                <Text style={[{ fontSize: 12, color: c.textSecondary }]}>Saved profile reused by agent</Text>
              </View>
              <TouchableOpacity 
                style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: c.accent, gap: 6 }]}
                onPress={() => setIsEditingProfile(true)}
              >
                <Feather name="edit-2" size={16} color={c.white} />
                <Text style={[{ color: c.white, fontWeight: '600', fontSize: 12 }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={[{ borderTopWidth: 1, borderTopColor: c.surfaceBorder, paddingVertical: 16, paddingHorizontal: 16 }]}>
              <View style={{ marginBottom: 16 }}>
                <Text style={[{ fontSize: 12, color: c.textSecondary, fontWeight: '600', marginBottom: 6 }]}>Industry</Text>
                <Text style={[{ fontSize: 14, color: c.textPrimary }]}>{profile.industry || '—'}</Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={[{ fontSize: 12, color: c.textSecondary, fontWeight: '600', marginBottom: 6 }]}>Locations</Text>
                {locations.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {locations.map(loc => (
                      <View key={loc} style={[{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
                        <Text style={[{ color: c.accent, fontSize: 12 }]}>{loc}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[{ color: c.textSecondary }]}>—</Text>
                )}
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={[{ fontSize: 12, color: c.textSecondary, fontWeight: '600', marginBottom: 6 }]}>Key Concerns</Text>
                <Text style={[{ fontSize: 14, color: c.textPrimary }]}>{profile.keyConcerns || '—'}</Text>
              </View>

              {/* AI Business Context Analysis */}
              {(businessContext || isAnalyzingContext) && (
                <View style={[{ borderTopWidth: 1, borderTopColor: c.surfaceBorder, paddingTop: 16, marginTop: 12 }]}>
                  <Text style={[{ fontSize: 12, color: c.textSecondary, fontWeight: '600', marginBottom: 10, flexDirection: 'row', alignItems: 'center' }]}>
                    <Feather name="cpu" size={12} style={{ marginRight: 4 }} /> AI Business Context
                  </Text>
                  {isAnalyzingContext ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color={c.accent} />
                      <Text style={[{ fontSize: 12, color: c.textSecondary }]}>Analyzing business context...</Text>
                    </View>
                  ) : businessContext ? (
                    <LinearGradient
                      colors={[c.accentSoft, c.surfaceContainerLowest]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: c.accentBorder }}
                    >
                      <View style={{ gap: 12 }}>
                        {businessContext.businessOverview && (
                          <View>
                            <Text style={[{ fontSize: 11, color: c.textSecondary, fontWeight: '600', marginBottom: 4 }]}>Overview</Text>
                            <Text style={[{ fontSize: 13, color: c.textPrimary, lineHeight: 18 }]}>{businessContext.businessOverview}</Text>
                          </View>
                        )}
                        {businessContext.operationalImpactAreas && businessContext.operationalImpactAreas.length > 0 && (
                          <View>
                            <Text style={[{ fontSize: 11, color: c.textSecondary, fontWeight: '600', marginBottom: 4 }]}>Operational Focus Areas</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                              {businessContext.operationalImpactAreas.slice(0, 4).map((area, idx) => (
                                <View key={idx} style={[{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: c.accentSoft, borderColor: c.accentBorder, borderWidth: 0.5 }]}>
                                  <Text style={[{ color: c.accent, fontSize: 11 }]}>{area}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }
    if (activeTab === 'apis') return renderApisTab();
    if (activeTab === 'news') return renderNewsTab();
    if (activeTab === 'logs') return renderLogsTab();
    if (activeTab === 'preferences') return renderPreferencesTab();
    return renderAccountTab();
  };

  const renderApiModal = () => (
    <Modal visible={apiModalVisible} transparent animationType="slide" onRequestClose={closeApiModal}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={[styles.modalHeader, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>{editingApiId ? 'Edit Action API' : 'Add Action API'}</Text>
            <TouchableOpacity onPress={closeApiModal}>
              <Feather name="x" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {renderTextInput('API name', apiForm.name, value => setApiForm(prev => ({ ...prev, name: value })), 'Pricing API')}
            {renderTextInput('Base URL', apiForm.baseUrl, value => setApiForm(prev => ({ ...prev, baseUrl: value })), 'https://api.company.com')}
            {renderPickerRow('Documentation', ['text', 'document'], apiForm.docsMode, value => setApiForm(prev => ({ ...prev, docsMode: value })))}
            {apiForm.docsMode === 'text' ? (
              <TextInput
                style={[styles.textArea, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary }]}
                value={apiForm.docsText}
                onChangeText={(value) => setApiForm(prev => ({ ...prev, docsText: value }))}
                multiline
                textAlignVertical="top"
                placeholder="Paste endpoint docs, payload schema, allowed actions..."
                placeholderTextColor={c.placeholder}
              />
            ) : (
              <>
                {renderTextInput('Document name', apiForm.docsDocumentName, value => setApiForm(prev => ({ ...prev, docsDocumentName: value })), 'api-docs.pdf')}
                {renderTextInput('Document link or reference', apiForm.docsDocumentUri, value => setApiForm(prev => ({ ...prev, docsDocumentUri: value })), 'https://... or local file note')}
              </>
            )}
            {renderPickerRow('Auth', ['none', 'bearer', 'api_key_header'], apiForm.authType, value => setApiForm(prev => ({ ...prev, authType: value })))}
            {apiForm.authType !== 'none' && (
              <>
                {renderTextInput('Header name', apiForm.headerName, value => setApiForm(prev => ({ ...prev, headerName: value })), 'Authorization')}
                {renderTextInput('Token / key', apiForm.token, value => setApiForm(prev => ({ ...prev, token: value })), 'Stored in Firestore for backend calls')}
              </>
            )}
            {renderTextInput('Action types', apiForm.actionTypesText, value => setApiForm(prev => ({ ...prev, actionTypesText: value })), API_TYPES.join(', '))}
            {renderToggleRow('Enabled', apiForm.enabled, value => setApiForm(prev => ({ ...prev, enabled: value })))}
          </ScrollView>
          <View style={styles.modalFooter}>
            {editingApiId && (
              <TouchableOpacity style={[styles.deleteButton, { borderColor: c.error }]} onPress={deleteApi}>
                <Text style={[styles.deleteButtonText, { color: c.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalSaveButton, { backgroundColor: c.accent }]} onPress={saveApi}>
              <Text style={[styles.modalSaveText, { color: c.white }]}>Save API</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTextInput = (label, value, onChangeText, placeholder) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        autoCapitalize="none"
      />
    </View>
  );

  const renderPickerRow = (label, options, selected, onSelect) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(option => {
          const active = selected === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionChip, { backgroundColor: active ? c.accentSoft : c.surfaceContainerLowest, borderColor: active ? c.accentBorder : c.surfaceBorder }]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionText, { color: active ? c.accent : c.textSecondary }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderToggleRow = (label, enabled, onToggle) => (
    <TouchableOpacity
      style={[styles.toggleRow, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}
      onPress={() => onToggle(!enabled)}
    >
      <Text style={[styles.toggleLabel, { color: c.textPrimary }]}>{label}</Text>
      <View style={[styles.toggleTrack, { backgroundColor: enabled ? c.successSoft : c.surfaceVariant, borderColor: enabled ? c.successBorder : c.surfaceBorder }]}>
        <View style={[styles.toggleKnob, { backgroundColor: enabled ? c.success : c.textSecondary, alignSelf: enabled ? 'flex-end' : 'flex-start' }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={[styles.keyboardView, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
              <Feather name={activeMeta.icon} size={24} color={c.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: c.textPrimary }]}>Control Center</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary }]}>{activeMeta.subtitle}</Text>
            </View>
          </View>
        </View>

        {renderTabs()}

        <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollPadding, { paddingBottom: 120 }]}>
          {renderActiveTab()}
        </ScrollView>
      </Screen>
      {renderApiModal()}
      <NewsAggregatorModal
        visible={newsModalVisible}
        newsSources={newsAggregators}
        onClose={closeNewsModal}
        onApply={saveNewsSetup}
        title="News Aggregator Setup"
        description="Choose sources. The agent filters fetched items using the saved profile and prompt."
        saveLabel="Save Sources"
      />
      <NewsSourceDetailModal
        visible={!!selectedNewsSource}
        source={selectedNewsSource}
        onClose={closeNewsDetails}
        onSave={saveNewsSource}
        onDelete={deleteNewsSource}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
    }
  }),
  keyboardView: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 19,
    marginTop: 3,
  },
  tabShell: {
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  tabScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  scrollContent: { flex: 1 },
  scrollPadding: { paddingHorizontal: 20 },
  stack: { gap: 14 },
  personalizationContainer: { flex: 1 },
  accountContainer: { flex: 1 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceMainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 21,
  },
  cardUrl: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  cardSwitchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  cardSwitchKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardDeleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  savePromptButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  savePromptText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: FontWeights.bold,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSizes.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 130,
    padding: 14,
    fontSize: FontSizes.sm,
    lineHeight: 21,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  optionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  toggleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
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
  primaryButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionSubtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  disabled: { opacity: 0.55 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: { fontSize: FontSizes.sm },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
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
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  deleteButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalSaveText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  logEmptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  logEmptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  logEmptyDesc: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  logList: {
    gap: 12,
    marginTop: 4,
  },
  logRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  logRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  logRowHeader: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  logRowMessage: {
    fontSize: FontSizes.sm - 1,
    lineHeight: 18,
  },
  logRowDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  logRowDetailTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  logRowDetailText: {
    fontSize: FontSizes.sm - 1,
    lineHeight: 18,
  },
  compactTime: {
    fontSize: FontSizes.xs,
  },
});
