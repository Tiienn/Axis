import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PRIVACY_URL = 'https://getaxis.chat/privacy';
const TERMS_URL = 'https://getaxis.chat/terms';

export default function Settings() {
  const { profile } = useSession();
  const status = profile?.subscription_status ?? 'free';
  const isPaid = status !== 'free';

  const onManageSubscription = () => {
    if (isPaid) {
      Alert.alert(
        'Manage subscription',
        'Once the iOS and Android apps ship, you can manage or cancel from the App Store / Play Store.',
      );
      return;
    }
    router.push({ pathname: '/paywall', params: { trigger: 'manual' } });
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      "We'll wipe your account and all your conversations. Email support@getaxis.chat and we'll handle it within a day.",
    );
  };

  const onSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.group}>
        <SettingsRow
          label="Manage subscription"
          value={isPaid ? (status === 'lifetime' ? 'Lifetime' : 'Pro') : 'Free'}
          onPress={onManageSubscription}
        />
      </View>

      <View style={styles.group}>
        <SettingsRow
          label="Privacy Policy"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <SettingsRow
          label="Terms of Service"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
      </View>

      <View style={styles.group}>
        <SettingsRow label="Delete my account" danger onPress={onDeleteAccount} />
        <SettingsRow label="Sign out" onPress={onSignOut} />
      </View>

      <Text style={styles.version}>
        Axis v{Application.nativeApplicationVersion ?? '0.0.0'}
      </Text>
    </SafeAreaView>
  );
}

function SettingsRow({
  label,
  value,
  danger,
  onPress,
}: {
  label: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={AxisColors.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AxisColors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  group: {
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomColor: AxisColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    backgroundColor: AxisColors.background,
  },
  rowLabel: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },
  rowLabelDanger: {
    color: AxisColors.crisis,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
  },
  version: {
    color: AxisColors.muted,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
