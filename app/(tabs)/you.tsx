import { useFocusEffect } from 'expo-router';
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

  const counterLabel = isPaid
    ? 'Unlimited messages'
    : usedCount === null
      ? 'Loading…'
      : `${Math.min(usedCount, FREE_DAILY_LIMIT)} / ${FREE_DAILY_LIMIT} messages today`;
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
      <View style={styles.stubs}>
        <Text style={styles.stub}>Settings · Subscription · Terms · Privacy</Text>
        <Text style={styles.stubNote}>Wired up in Week 7.</Text>
      </View>
      <Pressable onPress={() => supabase.auth.signOut()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
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
  stubs: {
    marginTop: 24,
  },
  stub: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  stubNote: {
    color: AxisColors.muted,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    marginTop: 6,
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
  signOut: {
    marginTop: 40,
    alignSelf: 'flex-start',
  },
  signOutText: {
    color: AxisColors.crisis,
    fontFamily: FontFamily.sansBold,
    fontSize: 14,
  },
});
