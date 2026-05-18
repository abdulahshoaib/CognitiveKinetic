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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useIntegrations } from '../context/IntegrationsContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile, saveProfile } from '../services/profileService';
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
  { id: 'preferences', label: 'Preferences', icon: 'sliders', subtitle: 'Visual and agent display controls.' },
  { id: 'account', label: 'Account', icon: 'user', subtitle: 'Identity, password, and session.' },
];

const API_TYPES = ['pricing_adjust', 'route_shift', 'notification', 'manual_review', 'custom'];

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
  } = useIntegrations();
  const c = activeTheme.colors;

  const [profile, setProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProfile = async (profileData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await saveProfile(user.uid, profileData);
      Alert.alert('Saved', 'Business profile updated.');
      navigation.goBack();
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

  const saveNewsSetup = ({ newsSources }) => {
    setNewsAggregators(newsSources);
    closeNewsModal();
  };

  const saveNewsSource = (source) => {
    setNewsAggregators(newsAggregators.map(item => item.id === source.id ? source : item));
    closeNewsDetails();
  };

  const deleteNewsSource = (id) => {
    setNewsAggregators(newsAggregators.filter(source => source.id !== id));
    closeNewsDetails();
  };

  const toggleNewsSource = (source) => {
    setNewsAggregators(newsAggregators.map(item => (
      item.id === source.id ? { ...item, enabled: item.enabled === false } : item
    )));
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
          style={[styles.integrationCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
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
      <View style={[styles.promptCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>News Agent Prompt</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>Controls what collected news should focus on.</Text>
          </View>
          <TouchableOpacity style={[styles.savePromptButton, { backgroundColor: c.accent }]} onPress={() => updateNewsSystemPrompt(promptDraft)}>
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
        return (
        <View
          key={source.id}
          style={[styles.integrationCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, opacity: enabled ? 1 : 0.68 }]}
        >
          <View style={styles.cardTopRow}>
            <TouchableOpacity style={styles.sourceMainButton} onPress={() => openNewsDetails(source)}>
              <View style={[styles.cardIcon, { backgroundColor: enabled ? c.accentSoft : c.surfaceVariant }]}>
                <Feather name="rss" size={18} color={enabled ? c.accent : c.textSecondary} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{source.name}</Text>
                <Text style={[styles.cardUrl, { color: c.textSecondary }]} numberOfLines={1}>
                  {source.sourceUrl || source.type}
                </Text>
              </View>
            </TouchableOpacity>
            {renderSwitch(enabled, () => toggleNewsSource(source))}
          </View>
          {source.keywords?.length > 0 && (
            <View style={styles.cardMetaRow}>
              {source.keywords.slice(0, 4).map(keyword => (
                <Text key={keyword} style={[styles.metaChip, { color: c.textSecondary, backgroundColor: c.surfaceContainerLowest }]}>
                  {keyword}
                </Text>
              ))}
              {source.keywords.length > 4 && (
                <Text style={[styles.metaChip, { color: c.textSecondary, backgroundColor: c.surfaceContainerLowest }]}>
                  +{source.keywords.length - 4}
                </Text>
              )}
            </View>
          )}
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
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
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
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
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
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
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

  const renderActiveTab = () => {
    if (activeTab === 'context') {
      return profile ? (
        <ProfileForm initialData={profile} onSave={handleSaveProfile} isSaving={isSaving} />
      ) : (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      );
    }
    if (activeTab === 'apis') return renderApisTab();
    if (activeTab === 'news') return renderNewsTab();
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
                {renderTextInput('Token / key', apiForm.token, value => setApiForm(prev => ({ ...prev, token: value })), 'Stored locally for demo')}
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
        description="Same source picker used by New Content. Configure URLs, APIs, keys, and source-specific keywords."
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
});
