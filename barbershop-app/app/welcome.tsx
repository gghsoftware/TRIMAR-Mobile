import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_SEEN_ONBOARDING_KEY = 'hasSeenOnboarding';

export default function Welcome() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
      
      if (!hasSeenOnboarding) {
        // First time user - show onboarding
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        // User is logged in - go to main app
        router.replace('/');
      } else {
        // Returning user but not logged in - go to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to login if there's an error
      router.replace('/login');
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  if (isLoading || isCheckingOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null; // This component only handles routing
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
