import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';

export default function App() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Cognitive<Text style={styles.titleAccent}>Kinetic</Text></Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Progress</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>You're on a 5-day streak! Keep it up.</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>75%</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.actionText}>Train</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.actionText}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#45B7D1' }]} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconPlaceholder, { backgroundColor: '#F9A03F' }]} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.mainCta}>
          <Text style={styles.mainCtaText}>Start Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 40,
  },
  greeting: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#38BDF8',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  badgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 16,
  },
  actionText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  mainCta: {
    backgroundColor: '#38BDF8',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCtaText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
