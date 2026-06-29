import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radius, fonts } from '../../lib/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  async function handleUpdate() {
    if (!password || password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Password updated!', 'You can now sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.iconCircle}>
          <Lock size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password for your account.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },
  field: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 14,
    fontFamily: fonts.regular, fontSize: 15, color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
