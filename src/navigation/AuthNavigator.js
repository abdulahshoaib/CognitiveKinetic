import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../constants/colors';
import { usePreferences } from '../context/PreferencesContext';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: c.background },
      headerTintColor: c.textPrimary,
      contentStyle: { backgroundColor: c.background }
    }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
}
