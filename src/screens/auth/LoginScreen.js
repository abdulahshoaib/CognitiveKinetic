import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginAnonymously, loginWithGoogle } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password required.');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await loginAnonymously();
    } catch (err) {
      Alert.alert('Demo Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken) => {
    try {
      setLoading(true);
      await loginWithGoogle(idToken);
    } catch (err) {
      Alert.alert('Google Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <MaterialIcons name="memory" size={32} color={Colors.textPrimary} />
          </View>
          <Text style={styles.title}>Cognitive Kinetic</Text>
          <Text style={styles.subtitle}>Log in to your workspace</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WORKSPACE EMAIL</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="name@company.com" 
                placeholderTextColor="rgba(198, 198, 205, 0.4)"
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>ACCESS SECRET</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="••••••••••••" 
                placeholderTextColor="rgba(198, 198, 205, 0.4)"
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.primaryText} /> : <Text style={styles.buttonText}>Log in</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin} disabled={loading}>
            <Text style={styles.demoButtonText}>Demo Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', backgroundColor: Colors.background, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 56, height: 56, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  form: { width: '100%', maxWidth: 420 },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 },
  label: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 4, paddingHorizontal: 4 },
  forgotText: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, backgroundColor: 'transparent', paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 16 },
  eyeIcon: { padding: 4 },
  button: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  buttonText: { color: Colors.primaryText, fontWeight: '700', fontSize: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32, width: '100%', maxWidth: 420 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.surfaceBorder },
  dividerText: { marginHorizontal: 16, color: 'rgba(198, 198, 205, 0.5)', fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  socialButtons: { width: '100%', maxWidth: 420, gap: 16 },
  googleButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.surfaceBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  googleButtonText: { color: Colors.textPrimary, fontSize: 16 },
  demoButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.surfaceBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  demoButtonText: { color: Colors.textPrimary, fontSize: 16 },
  footer: { flexDirection: 'row', marginTop: 32, justifyContent: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  signupText: { color: Colors.textPrimary, fontWeight: '500', fontSize: 14 }
});
