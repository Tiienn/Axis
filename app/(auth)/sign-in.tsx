import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  };

  const disabled = !email || !password || loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={styles.wordmark}>Axis</Text>
          <Text style={styles.heading}>Welcome back</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={AxisColors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={AxisColors.muted}
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={disabled} style={[styles.button, disabled && styles.buttonDisabled]}>
            {loading ? (
              <ActivityIndicator color={AxisColors.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/(auth)/sign-up" style={styles.link}>
              Create an account
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AxisColors.background },
  flex: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 48, gap: 14 },
  wordmark: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 38,
  },
  heading: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },
  error: {
    color: AxisColors.crisis,
    fontFamily: FontFamily.sans,
    fontSize: 13,
  },
  button: {
    backgroundColor: AxisColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: AxisColors.textSecondary, fontFamily: FontFamily.sans, fontSize: 14 },
  link: { color: AxisColors.primary, fontFamily: FontFamily.sansBold, fontSize: 14 },
});
