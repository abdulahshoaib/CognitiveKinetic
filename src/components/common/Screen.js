import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { usePreferences } from '../../context/PreferencesContext';

export default function Screen({ children, scroll = false, style, contentContainerStyle, safeAreaStyle, ...containerProps }) {
  const Container = scroll ? ScrollView : View;
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }, safeAreaStyle]}>
      <Container
        {...containerProps}
        style={[styles.container, { backgroundColor: c.background }, style]}
        keyboardShouldPersistTaps={scroll ? 'handled' : undefined}
        contentContainerStyle={scroll ? [styles.scrollContent, { backgroundColor: c.background }, contentContainerStyle] : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 112,
  },
});
