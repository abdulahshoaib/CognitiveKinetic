import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile, saveProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import ProfileForm from '../components/common/ProfileForm';
import SegmentedControl from '../components/preferences/SegmentedControl';
import ThemeSelector from '../components/preferences/ThemeSelector';
import ThemePreviewCard from '../components/preferences/ThemePreviewCard';
import SettingRow from '../components/preferences/SettingRow';

const getDensityStyle = (density) => {
  switch (density) {
    case 'compact':
      return {
        padding: 12,
        gap: 8,
        fontSizeTitle: FontSizes.lg,
        fontSizeSubtitle: FontSizes.xs,
        fontSizeBody: FontSizes.xs,
        cardPadding: 12,
        cardMarginBottom: 10,
        headerPaddingTop: 16,
      };
    case 'spacious':
      return {
        padding: 24,
        gap: 20,
        fontSizeTitle: FontSizes.xxl,
        fontSizeSubtitle: FontSizes.md,
        fontSizeBody: FontSizes.md,
        cardPadding: 24,
        cardMarginBottom: 24,
        headerPaddingTop: 36,
      };
    case 'cozy':
    default:
      return {
        padding: 18,
        gap: 14,
        fontSizeTitle: FontSizes.xl,
        fontSizeSubtitle: FontSizes.sm,
        fontSizeBody: FontSizes.sm,
        cardPadding: 16,
        cardMarginBottom: 16,
        headerPaddingTop: 28,
      };
  }
};

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { user, logout, resetPassword, updateDisplayName } = useAuth();
  const { preferences, updatePreference, activeTheme } = usePreferences();
  const c = activeTheme.colors;
  
  const [profile, setProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('context'); // 'context' | 'personalization' | 'account'

  // Account tab states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const email = user?.email || '';
  const isDemo = !!user?.isAnonymous;

  const density = preferences.density || 'cozy';
  const ds = getDensityStyle(density);

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const loadProfile = async () => {
    try {
      const activeProfile = await getProfile(user.uid);
      setProfile(activeProfile || {});
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (profileData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await saveProfile(user.uid, profileData);
      Alert.alert('Success', 'Business profile updated successfully.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
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
      Alert.alert('Saved', 'Your display name has been updated.');
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Password reset unavailable', 'This account does not have an email address connected.');
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPassword(email);
      Alert.alert('Check your email', `Password reset instructions were sent to ${email}.`);
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

  return (
    <KeyboardAvoidingView 
      style={[styles.keyboardView, { backgroundColor: c.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={false}>
        {/* Header Display */}
        <View style={[styles.header, { paddingTop: ds.headerPaddingTop }]}>
          <View style={styles.headerRow}>
            {activeTab === 'account' ? (
              <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                <Feather name="user" size={density === 'compact' ? 20 : 26} color={c.white} />
              </View>
            ) : null}
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: c.textPrimary, fontSize: ds.fontSizeTitle }]}>
                {activeTab === 'account' ? (user?.displayName || 'User Account') : 'Settings'}
              </Text>
              <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: ds.fontSizeSubtitle }]}>
                {activeTab === 'account' ? (email || 'Demo session') : 'Tune your personal operating system.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { borderBottomColor: c.surfaceBorderSubtle }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'context' && { borderBottomColor: c.accent }]}
            onPress={() => setActiveTab('context')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'context' ? c.textPrimary : c.textSecondary, fontSize: ds.fontSizeBody }]}>Business Context</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'personalization' && { borderBottomColor: c.accent }]}
            onPress={() => setActiveTab('personalization')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'personalization' ? c.textPrimary : c.textSecondary, fontSize: ds.fontSizeBody }]}>Personalization</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'account' && { borderBottomColor: c.accent }]}
            onPress={() => setActiveTab('account')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'account' ? c.textPrimary : c.textSecondary, fontSize: ds.fontSizeBody }]}>Account</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollPadding, { paddingBottom: 120 }]}>
          {activeTab === 'context' && (
            profile ? (
              <ProfileForm 
                initialData={profile} 
                onSave={handleSaveProfile} 
                isSaving={isSaving} 
              />
            ) : (
              <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
            )
          )}

          {activeTab === 'personalization' && (
            <View style={styles.personalizationContainer}>
              <ThemePreviewCard />

              <SettingRow 
                title="Theme Mode" 
                description="Choose the visual aesthetic of your workspace. Changes here apply immediately."
              >
                <ThemeSelector 
                  selected={preferences.themeMode}
                  onSelect={(val) => updatePreference('themeMode', val)}
                />
              </SettingRow>

              <SettingRow 
                title="App Density" 
                description="Adjust padding, layout scale, and spacing dynamically across the entire app."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Compact', value: 'compact' },
                    { label: 'Cozy', value: 'cozy' },
                    { label: 'Spacious', value: 'spacious' }
                  ]}
                  selected={preferences.density || 'cozy'}
                  onSelect={(val) => updatePreference('density', val)}
                />
              </SettingRow>

              <SettingRow 
                title="Insight Style" 
                description="How agent insights are presented to you."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Simple', value: 'simple' },
                    { label: 'Detailed', value: 'detailed' },
                    { label: 'Technical', value: 'technical' }
                  ]}
                  selected={preferences.insightStyle}
                  onSelect={(val) => updatePreference('insightStyle', val)}
                />
              </SettingRow>

              <SettingRow 
                title="Motion & Feedback" 
                description="Control the speed and presence of UI animations."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Full', value: 'full' },
                    { label: 'Reduced', value: 'reduced' },
                    { label: 'Minimal', value: 'minimal' }
                  ]}
                  selected={preferences.motion}
                  onSelect={(val) => updatePreference('motion', val)}
                />
              </SettingRow>
              
              <SettingRow 
                title="Home Screen Focus" 
                description="What the dashboard prioritizes on load."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Latest Insight', value: 'latest-insight' },
                    { label: 'Action Queue', value: 'action-queue' },
                    { label: 'Progress', value: 'progress-summary' }
                  ]}
                  selected={preferences.homeFocus}
                  onSelect={(val) => updatePreference('homeFocus', val)}
                />
              </SettingRow>
              
              <SettingRow 
                title="Agent Transparency" 
                description="How much background processing is visible."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Hidden', value: 'hidden' },
                    { label: 'Summary Only', value: 'summary-only' },
                    { label: 'Full Trace', value: 'full-trace' }
                  ]}
                  selected={preferences.agentTransparency}
                  onSelect={(val) => updatePreference('agentTransparency', val)}
                />
              </SettingRow>
              
              <View style={{height: 40}} />
            </View>
          )}

          {activeTab === 'account' && (
            <View style={styles.accountContainer}>
              <Text style={[styles.sectionTitle, { color: c.textPrimary, fontSize: ds.fontSizeTitle - 2 }]}>Identity</Text>
              <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.cardPadding, marginBottom: ds.cardMarginBottom }]}>
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

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: c.accent }]}
                  onPress={handleSaveName}
                  disabled={isSavingName}
                >
                  {isSavingName ? (
                    <ActivityIndicator color={c.white} />
                  ) : (
                    <>
                      <Feather name="check" size={18} color={c.white} />
                      <Text style={[styles.primaryButtonText, { color: c.white }]}>Save Username</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: c.textPrimary, fontSize: ds.fontSizeTitle - 2 }]}>Security</Text>
              <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.cardPadding, marginBottom: ds.cardMarginBottom }]}>
                <View style={styles.actionRow}>
                  <View style={[styles.actionIcon, { backgroundColor: c.primarySubtle }]}>
                    <Feather name="key" size={18} color={c.primary} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, { color: c.textPrimary }]}>Change password</Text>
                    <Text style={[styles.actionSubtitle, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>
                      {isDemo ? 'Password changes are unavailable for demo sessions.' : 'Send a secure password reset link to your email.'}
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

              <Text style={[styles.sectionTitle, { color: c.textPrimary, fontSize: ds.fontSizeTitle - 2 }]}>Session Info</Text>
              <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.cardPadding, marginBottom: ds.cardMarginBottom }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>Account Type</Text>
                  <Text style={[styles.detailValue, { color: c.textPrimary, fontSize: ds.fontSizeBody }]}>{isDemo ? 'Demo Session' : 'Registered Account'}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: c.surfaceBorder }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: c.textPrimary, fontSize: ds.fontSizeBody }]}>{email || 'Not connected'}</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: c.errorSoft, borderColor: c.error }]} onPress={handleLogout}>
                <Feather name="log-out" size={18} color={c.error} />
                <Text style={[styles.logoutText, { color: c.error }]}>Log Out Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 20,
  },
  personalizationContainer: {
    flex: 1,
  },
  accountContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: FontWeights.bold,
    marginTop: 10,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSizes.md,
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
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionSubtitle: {
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
  disabled: {
    opacity: 0.55,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
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
});
