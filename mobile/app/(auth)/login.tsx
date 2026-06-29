import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radius, fonts } from '../../lib/theme';
import Button from '../../components/Button';

const SAVED_EMAIL_KEY = 'ppf_saved_email';
const REMEMBER_ME_KEY = 'ppf_remember_me';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Load saved email on mount
  useEffect(() => {
    SecureStore.getItemAsync(REMEMBER_ME_KEY).then(val => {
      if (val === 'true') {
        SecureStore.getItemAsync(SAVED_EMAIL_KEY).then(saved => {
          if (saved) setEmail(saved);
        });
      }
    });
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Login failed', error.message);
    } else {
      // Save or clear email based on remember me
      if (rememberMe) {
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email.trim());
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'false');
      }
    }
    // onAuthStateChange in _layout.tsx handles redirect
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your PPF account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(v => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Check size={12} color={colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Remember my email</Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth style={styles.submitBtn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, flexGrow: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.xl },
  title: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginBottom: spacing.xs },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xxxl },
  form: { gap: spacing.sm },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginBottom: 4 },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, top: 14 },
  forgot: { fontFamily: fonts.medium, fontSize: 13, color: colors.primary, alignSelf: 'flex-end', marginTop: 4 },
  rememberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  rememberText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  submitBtn: { marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxxl },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  footerLink: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },
});
