import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Onboarding() {
  const { session, refreshProfile } = useSession();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [situation, setSituation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from('users')
      .update({
        profile_json: {
          name: name.trim(),
          goal: goal.trim(),
          situation: situation.trim(),
        },
      })
      .eq('id', session.user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  };

  const disabled = !name.trim() || !goal.trim() || !situation.trim() || loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>A few quick things.</Text>
          <Text style={styles.sub}>Your bots use this to talk to you like a person.</Text>

          <Text style={styles.label}>What should they call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={AxisColors.muted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>What brings you here?</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Dating, a breakup, getting fit, a rough patch…"
            placeholderTextColor={AxisColors.muted}
            multiline
            value={goal}
            onChangeText={setGoal}
          />

          <Text style={styles.label}>Where are you right now?</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Single? In a relationship? Job, city, life stage…"
            placeholderTextColor={AxisColors.muted}
            multiline
            value={situation}
            onChangeText={setSituation}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={submit} disabled={disabled} style={[styles.button, disabled && styles.buttonDisabled]}>
            {loading ? (
              <ActivityIndicator color={AxisColors.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Meet the bots</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AxisColors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 10 },
  heading: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
  },
  sub: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
    marginTop: 16,
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
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: {
    color: AxisColors.crisis,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    backgroundColor: AxisColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
  },
});
