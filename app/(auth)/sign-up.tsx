import { Link, router } from 'expo-router';
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

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

function ageAt(dobIso: string, now = new Date()): number | null {
  if (!DOB_RE.test(dobIso)) return null;
  const d = new Date(dobIso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    const age = ageAt(dob);
    if (age === null) {
      setError('Enter date of birth as YYYY-MM-DD.');
      return;
    }
    if (age < 18) {
      setError('You must be 18 or older to use Axis.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/(auth)/onboarding');
  };

  const disabled = !email || !password || !dob || loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={styles.wordmark}>Axis</Text>
          <Text style={styles.heading}>Create your account</Text>

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
            placeholder="Password (min 8 characters)"
            placeholderTextColor={AxisColors.muted}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of birth (YYYY-MM-DD)"
            placeholderTextColor={AxisColors.muted}
            autoCapitalize="none"
            value={dob}
            onChangeText={setDob}
          />
          <Text style={styles.hint}>Axis is 18+. We check once at signup.</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={disabled} style={[styles.button, disabled && styles.buttonDisabled]}>
            {loading ? (
              <ActivityIndicator color={AxisColors.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
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
  hint: {
    color: AxisColors.muted,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    marginTop: -6,
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
