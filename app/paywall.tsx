import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';
import { track } from '@/lib/analytics';

const TIERS = [
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: '$12.99',
    period: '/month',
    blurb: 'Unlimited messages, all 4 advisors, cancel anytime.',
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Pro Yearly',
    price: '$79',
    period: '/year',
    blurb: 'Best value — 50% off monthly. Just $6.58/mo.',
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$199',
    period: 'once',
    blurb: 'Launch-only. 500 seats total. Pay once, keep forever.',
    highlight: false,
  },
];

export default function Paywall() {
  const { trigger } = useLocalSearchParams<{ trigger?: string }>();
  useEffect(() => {
    track('paywall_shown', { trigger: trigger ?? 'manual' });
  }, [trigger]);

  const onUpgrade = () => {
    Alert.alert(
      'Coming soon',
      'Upgrades go live once the iOS and Android apps ship. The web version is in preview — you still get the full chat experience while we wire up payments.',
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={24} color={AxisColors.textPrimary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>You've hit today's free limit</Text>
        <Text style={styles.subtitle}>
          10 messages a day is enough to meet the advisors. Upgrade to keep the conversation going.
        </Text>

        <View style={styles.tiers}>
          {TIERS.map((tier) => (
            <View
              key={tier.id}
              style={[styles.tier, tier.highlight && styles.tierHighlight]}
            >
              {tier.highlight ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Best value</Text>
                </View>
              ) : null}
              <Text style={styles.tierName}>{tier.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{tier.price}</Text>
                <Text style={styles.period}>{tier.period}</Text>
              </View>
              <Text style={styles.blurb}>{tier.blurb}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onUpgrade} style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.notNow}>
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>

        <Text style={styles.reset}>Your free messages reset 24 hours after you started.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AxisColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    marginTop: 8,
  },
  subtitle: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  tiers: {
    gap: 12,
    marginTop: 28,
  },
  tier: {
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  tierHighlight: {
    borderColor: AxisColors.primary,
    borderWidth: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: AxisColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    color: AxisColors.background,
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tierName: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  price: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
  },
  period: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  blurb: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  upgradeButton: {
    marginTop: 24,
    backgroundColor: AxisColors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeText: {
    color: AxisColors.background,
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
  },
  notNow: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  notNowText: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  reset: {
    color: AxisColors.muted,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
