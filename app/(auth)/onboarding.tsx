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
import { track } from '@/lib/analytics';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const GOAL_OPTIONS = [
  'Dating',
  'A breakup',
  'A rough patch',
  'Sex & intimacy',
  'Getting in shape',
  'Career',
  'General self-work',
  'Something else',
] as const;

const SITUATION_OPTIONS = [
  'Single',
  'In a relationship',
  'Married',
  'Divorced / separated',
  'It\u2019s complicated',
  'Prefer not to say',
  'Something else',
] as const;

const OTHER = 'Something else';

export default function Onboarding() {
  const { session, refreshProfile } = useSession();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [goalOther, setGoalOther] = useState('');
  const [situation, setSituation] = useState<string | null>(null);
  const [situationOther, setSituationOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goalValue = goal === OTHER ? goalOther.trim() : (goal ?? '');
  const situationValue = situation === OTHER ? situationOther.trim() : (situation ?? '');

  const submit = async () => {
    setError(null);
    if (!session) {
      setError(
        'Not signed in. If you just created an account, check your email to verify, then sign in.',
      );
      return;
    }
    if (!name.trim() || !goalValue || !situationValue) return;
    setLoading(true);
    const { error: err } = await supabase
      .from('users')
      .update({
        profile_json: {
          name: name.trim(),
          goal: goalValue,
          situation: situationValue,
        },
      })
      .eq('id', session.user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    track('onboarding_completed');
    await refreshProfile();
    router.replace('/(tabs)');
  };

  const disabled = !name.trim() || !goalValue || !situationValue || loading;

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
          <ChipGroup
            options={GOAL_OPTIONS}
            selected={goal}
            onSelect={setGoal}
          />
          {goal === OTHER && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Tell us in a few words"
              placeholderTextColor={AxisColors.muted}
              value={goalOther}
              onChangeText={setGoalOther}
            />
          )}

          <Text style={styles.label}>Where are you right now?</Text>
          <ChipGroup
            options={SITUATION_OPTIONS}
            selected={situation}
            onSelect={setSituation}
          />
          {situation === OTHER && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Tell us in a few words"
              placeholderTextColor={AxisColors.muted}
              value={situationOther}
              onChangeText={setSituationOther}
            />
          )}

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

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: readonly string[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AxisColors.border,
    backgroundColor: AxisColors.surface,
  },
  chipActive: {
    borderColor: AxisColors.primary,
    backgroundColor: AxisColors.primary,
  },
  chipText: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  chipTextActive: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sansBold,
  },
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
