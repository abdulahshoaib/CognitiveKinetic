import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <MaterialIcons name="memory" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Cognitive Kinetic</Text>
              <Text style={styles.subtitle}>Log in to your workspace</Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WORKSPACE EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail" size={20} color={Colors.slateText} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="name@company.com" 
                    placeholderTextColor={Colors.placeholder}
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
                  <MaterialIcons name="lock" size={20} color={Colors.slateText} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    placeholderTextColor={Colors.placeholder}
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={Colors.slateText} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Log in</Text>}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center', backgroundColor: Colors.background, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 56, height: 56, backgroundColor: Colors.l1Surface, borderWidth: 1, borderColor: Colors.l1Border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.white, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.slateText },
  form: { width: '100%', maxWidth: 420 },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4, paddingHorizontal: 4 },
  label: { fontSize: 11, fontWeight: '600', color: Colors.slateText, letterSpacing: 0.5, marginBottom: 4, paddingHorizontal: 4 },
  forgotText: { fontSize: 11, fontWeight: '600', color: Colors.accent, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.l1Border, borderRadius: 12, backgroundColor: Colors.l1Surface, paddingHorizontal: 16, minHeight: 48 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.white, fontSize: 16, paddingVertical: 12 },
  eyeIcon: { padding: 4 },
  button: { backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  buttonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32, width: '100%', maxWidth: 420 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.l1Border },
  dividerText: { marginHorizontal: 16, color: Colors.slateText, fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  socialButtons: { width: '100%', maxWidth: 420, gap: 16 },
  googleButton: { backgroundColor: Colors.l1Surface, borderWidth: 1, borderColor: Colors.l1Border, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  googleButtonText: { color: Colors.white, fontSize: 16 },
  demoButton: { backgroundColor: Colors.l1Surface, borderWidth: 1, borderColor: Colors.l1Border, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  demoButtonText: { color: Colors.white, fontSize: 16 },
  footer: { flexDirection: 'row', marginTop: 32, justifyContent: 'center' },
  footerText: { color: Colors.slateText, fontSize: 14 },
  signupText: { color: Colors.accent, fontWeight: '700', fontSize: 14 }
});
