import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxisColors, FontFamily } from '@/constants/theme';

export default function You() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Free tier</Text>
        <Text style={styles.cardValue}>10 / 10 messages today</Text>
      </View>
      <View style={styles.stubs}>
        <Text style={styles.stub}>Settings · Subscription · Terms · Privacy</Text>
        <Text style={styles.stubNote}>Wired up in Weeks 6–7.</Text>
      </View>
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
});
