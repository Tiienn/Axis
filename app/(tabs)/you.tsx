import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const FREE_DAILY_LIMIT = 10;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export default function You() {
  const { profile, session } = useSession();
  const name = profile?.profile_json?.name;
  const email = session?.user.email;
  const status = profile?.subscription_status ?? 'free';
  const isPaid = status !== 'free';
  const [usedCount, setUsedCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isPaid) return;
      let cancelled = false;
      (async () => {
        const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
        const res = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .gte('created_at', since);
        if (!cancelled) setUsedCount(res.count ?? 0);
      })();
      return () => {
        cancelled = true;
      };
    }, [isPaid]),
  );

  const remaining = usedCount === null ? null : Math.max(0, FREE_DAILY_LIMIT - usedCount);
  const counterLabel = isPaid
    ? 'Unlimited messages'
    : remaining === null
      ? 'Loading…'
      : `${remaining} of ${FREE_DAILY_LIMIT} messages left today`;
  const tierLabel = isPaid ? (status === 'lifetime' ? 'Lifetime' : 'Pro') : 'Free tier';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
        {name ? <Text style={styles.subtitle}>{name}</Text> : null}
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{tierLabel}</Text>
        <Text style={styles.cardValue}>{counterLabel}</Text>
      </View>
      <Pressable
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
      >
        <Text style={styles.settingsLabel}>Settings</Text>
        <Ionicons name="chevron-forward" size={18} color={AxisColors.muted} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AxisColors.background,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 36,
  },
  card: {
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardLabel: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 13,
  },
  cardValue: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
    marginTop: 4,
  },
  settingsRow: {
    marginTop: 24,
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsRowPressed: {
    opacity: 0.7,
  },
  settingsLabel: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },
  subtitle: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 16,
    marginTop: 4,
  },
  email: {
    color: AxisColors.muted,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    marginTop: 2,
  },
});
