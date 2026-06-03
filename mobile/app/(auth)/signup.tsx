import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radius, fonts } from '../../lib/theme';
import Button from '../../components/Button';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'engineer' | 'client'>('engineer');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), user_type: userType } },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.user) {
      // Upsert profile row
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        user_type: userType,
        token_balance: 0,
      });
    }
    setLoading(false);
    // onAuthStateChange handles redirect
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.sub}>Join 10,000+ engineering professionals</Text>

          {/* User type toggle */}
          <View style={styles.typeRow}>
            {(['engineer', 'client'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, userType === t && styles.typeBtnActive]}
                onPress={() => setUserType(t)}
              >
                <Text style={[styles.typeBtnText, userType === t && styles.typeBtnTextActive]}>
                  {t === 'engineer' ? '⚙️ Engineer' : '🏢 Client'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="John Smith" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

            <Text style={styles.label}>Work Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@company.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min. 8 characters" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" />

            <Button title="Create Account" onPress={handleSignup} loading={loading} fullWidth style={styles.submitBtn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
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
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  typeBtn: {
    flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.background },
  typeBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.primary },
  form: { gap: spacing.sm },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginBottom: 4 },
  input: {
    height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, fontFamily: fonts.regular, fontSize: 15,
    color: colors.text, backgroundColor: colors.surface,
  },
  submitBtn: { marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxxl },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  footerLink: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },
});
