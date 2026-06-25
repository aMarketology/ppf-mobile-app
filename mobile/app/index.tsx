import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    // Single initial auth check — determines where to route on app open
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    });
  }, []);

  // Dark background while checking session — prevents white flash
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );
}
