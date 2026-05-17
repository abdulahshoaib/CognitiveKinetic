import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';

export default function UserPreferencesScreen() {
  const { user, logout, resetPassword, updateDisplayName } = useAuth();
  const { preferences, activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const backgroundWash = preferences.themeMode === 'ember-carbon'
    ? c.background
    : preferences.themeMode === 'graphite-copper'
      ? '#100d09'
      : '#201728';
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const email = user?.email || '';
  const isDemo = !!user?.isAnonymous;

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
    <Screen
      scroll={true}
      style={{ backgroundColor: backgroundWash }}
      safeAreaStyle={{ backgroundColor: backgroundWash }}
      contentContainerStyle={{ backgroundColor: backgroundWash }}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: c.accent }]}>
          <Feather name="user" size={28} color={c.white} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.textPrimary }]}>{user?.displayName || 'User account'}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{email || 'Demo session'}</Text>
        </View>
      </View>

      <SectionHeader title="Account" subtitle="Manage your personal login and account identity." />
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
              <Text style={[styles.primaryButtonText, { color: c.white }]}>Save username</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SectionHeader title="Security" subtitle="Password and session controls for this account." />
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, { backgroundColor: c.primarySubtle }]}>
            <Feather name="key" size={18} color={c.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: c.textPrimary }]}>Change password</Text>
            <Text style={[styles.actionSubtitle, { color: c.textSecondary }]}>
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
            <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>Send reset email</Text>
          )}
        </TouchableOpacity>
      </View>

      <SectionHeader title="Session" />
      <View style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Account type</Text>
          <Text style={[styles.detailValue, { color: c.textPrimary }]}>{isDemo ? 'Demo' : 'Email account'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: c.surfaceBorder }]} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Email</Text>
          <Text style={[styles.detailValue, { color: c.textPrimary }]}>{email || 'Not connected'}</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: c.errorSoft, borderColor: c.error }]} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={c.error} />
        <Text style={[styles.logoutText, { color: c.error }]}>Log out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 8,
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
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  logoutButton: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
