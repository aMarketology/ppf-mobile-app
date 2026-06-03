import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    });
  }, []);

  return null;
}
