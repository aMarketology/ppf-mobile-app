import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    // Small delay to ensure the root layout and auth listener are mounted first
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Dark background while checking session — prevents white flash
  return (
    <View style={{ flex: 1, backgroundColor: '#052e16', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#F59E0B" size="large" />
    </View>
  );
}
