import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Track whether we've already navigated to avoid redirect loops
  const hasNavigated = useRef(false);

  // ── Handle incoming deep links (password reset email link) ──────────────
  async function handleDeepLink(url: string) {
    if (!url) return;

    // Supabase sends either:
    //   PKCE flow  → ppf://reset-password?code=XXXX
    //   Legacy     → ppf://reset-password#access_token=XX&refresh_token=XX&type=recovery
    if (!url.includes('reset-password')) return;

    try {
      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const query    = url.includes('?') ? url.split('?')[1] : '';
      const params   = new URLSearchParams(query || fragment);

      const code          = params.get('code');
      const access_token  = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (code) {
        // PKCE flow — exchange the one-time code for a real session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // PASSWORD_RECOVERY event will fire → _layout listener below handles nav
        }
      } else if (access_token && refresh_token) {
        // Legacy implicit flow
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    } catch (e) {
      console.warn('Deep link handling error:', e);
    }
  }

  useEffect(() => {
    // Handle deep link if app was cold-started via the reset link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    // Handle deep link if app was already open
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        hasNavigated.current = true;
        router.replace('/(auth)/reset-password');
      } else if (event === 'SIGNED_OUT') {
        hasNavigated.current = false;
        router.replace('/(auth)/login');
      } else if (event === 'SIGNED_IN' && !hasNavigated.current) {
        hasNavigated.current = true;
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  // Show spinner while fonts load; if fonts fail, continue anyway
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="engineer/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="service/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="messages/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="buy-tokens" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
