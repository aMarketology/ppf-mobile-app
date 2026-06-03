import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radius, fonts } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Please enter the email address for your account.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'ppf://reset-password',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.sentContainer}>
          <View style={styles.sentIcon}>
            <Mail size={40} color={colors.primary} />
          </View>
          <Text style={styles.sentTitle}>Check your email</Text>
          <Text style={styles.sentSub}>
            We've sent a password reset link to{'\n'}<Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.iconCircle}>
          <Mail size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          No worries — enter your email and we'll send you a reset link.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
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
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.resetBtnText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Back to Sign In</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backBtn: { width: 44, height: 44, justifyContent: 'center', paddingLeft: spacing.lg },
  content: { flex: 1, padding: spacing.xl, paddingTop: spacing.lg },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },
  field: { marginBottom: spacing.xl },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 14,
    fontFamily: fonts.regular, fontSize: 15, color: colors.text,
  },
  resetBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  resetBtnDisabled: { opacity: 0.6 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sentIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  sentTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  sentSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: spacing.xl },
  emailHighlight: { fontFamily: fonts.semiBold, color: colors.text },
  backToLogin: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  backToLoginText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});
