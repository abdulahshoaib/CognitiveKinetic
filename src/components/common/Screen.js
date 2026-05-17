import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';

export default function Screen({ children, scroll = false, style, contentContainerStyle }) {
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Container
        style={[styles.container, style]}
        keyboardShouldPersistTaps={scroll ? 'handled' : undefined}
        contentContainerStyle={scroll ? [styles.scrollContent, contentContainerStyle] : undefined}
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
