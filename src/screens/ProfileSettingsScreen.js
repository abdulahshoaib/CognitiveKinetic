import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile, saveProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import ProfileForm from '../components/common/ProfileForm';
import SegmentedControl from '../components/preferences/SegmentedControl';
import ThemePreviewCard from '../components/preferences/ThemePreviewCard';
import SettingRow from '../components/preferences/SettingRow';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { preferences, updatePreference, activeTheme } = usePreferences();
  const c = activeTheme.colors;
  
  const [profile, setProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('context'); // 'context' | 'personalization'

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user?.uid]);

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
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.keyboardView, { backgroundColor: c.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Tune your personal operating system.
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { borderBottomColor: c.surfaceBorderSubtle }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'context' && { borderBottomColor: c.accent }]}
            onPress={() => setActiveTab('context')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'context' ? c.textPrimary : c.textSecondary }]}>Business Context</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'personalization' && { borderBottomColor: c.accent }]}
            onPress={() => setActiveTab('personalization')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'personalization' ? c.textPrimary : c.textSecondary }]}>Personalization</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
          {activeTab === 'context' ? (
            profile ? (
              <ProfileForm 
                initialData={profile} 
                onSave={handleSaveProfile} 
                isSaving={isSaving} 
              />
            ) : null
          ) : (
            <View style={styles.personalizationContainer}>
              <ThemePreviewCard />

              <SettingRow 
                title="Theme Mode" 
                description="Choose the visual aesthetic of your workspace. Changes here require an app restart to apply to all screens fully."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Ember Carbon', value: 'ember-carbon' },
                    { label: 'Graphite Copper', value: 'graphite-copper' },
                    { label: 'Plum Clay', value: 'plum-clay' }
                  ]}
                  selected={preferences.themeMode}
                  onSelect={(val) => updatePreference('themeMode', val)}
                />
              </SettingRow>

              <SettingRow 
                title="App Density" 
                description="Control how compact lists and cards appear."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Comfortable', value: 'comfortable' },
                    { label: 'Compact', value: 'compact' },
                    { label: 'Dense', value: 'data-dense' }
                  ]}
                  selected={preferences.density}
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
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  personalizationContainer: {
    flex: 1,
  }
});
