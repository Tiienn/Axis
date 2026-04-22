import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, router } from 'expo-router';
import { createElement, useState } from 'react';
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
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

function formatDob(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ageAt(d: Date, now = new Date()): number {
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

const DEFAULT_DOB = new Date(2000, 0, 1);

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const submit = async () => {
    setError(null);
    if (!dob) {
      setError('Please pick your date of birth.');
      return;
    }
    if (ageAt(dob) < 18) {
      setError('You must be 18 or older to use Axis.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    track('sign_up');
    if (!data.session) {
      setNeedsVerify(true);
      return;
    }
    router.replace('/(auth)/onboarding');
  };

  const disabled = !email || !password || !dob || loading;

  if (needsVerify) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <Text style={styles.wordmark}>Axis</Text>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.verifyBody}>
            We sent a confirmation link to <Text style={styles.verifyEmail}>{email}</Text>. Tap it,
            then come back and sign in.
          </Text>
          <Pressable
            onPress={() => router.replace('/(auth)/sign-in')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Go to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dobLabel = dob ? formatDob(dob) : 'Date of birth';

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

          {Platform.OS === 'web' ? (
            createElement('input', {
              type: 'date',
              value: dob ? formatDob(dob) : '',
              max: formatDob(new Date()),
              onChange: (e: { target: { value: string } }) => {
                const v = e.target.value;
                if (!v) {
                  setDob(null);
                  return;
                }
                const d = new Date(`${v}T00:00:00`);
                if (!Number.isNaN(d.getTime())) setDob(d);
              },
              style: {
                backgroundColor: AxisColors.surface,
                border: `1px solid ${AxisColors.border}`,
                borderRadius: 10,
                padding: 14,
                color: AxisColors.textPrimary,
                fontFamily: `${FontFamily.sans}, -apple-system, sans-serif`,
                fontSize: 15,
                outline: 'none',
                colorScheme: 'dark',
              },
            })
          ) : (
            <>
              <Pressable onPress={() => setShowPicker(true)} style={styles.input}>
                <Text
                  style={[
                    styles.pickerText,
                    !dob && { color: AxisColors.muted },
                  ]}
                >
                  {dobLabel}
                </Text>
              </Pressable>
              {showPicker && (
                <DateTimePicker
                  value={dob ?? DEFAULT_DOB}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, picked) => {
                    if (Platform.OS !== 'ios') setShowPicker(false);
                    if (picked) setDob(picked);
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPicker && (
                <Pressable onPress={() => setShowPicker(false)} style={styles.pickerDone}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </Pressable>
              )}
            </>
          )}
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
    justifyContent: 'center',
  },
  pickerText: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pickerDoneText: {
    color: AxisColors.primary,
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
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
  verifyBody: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  verifyEmail: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sansBold,
  },
});
