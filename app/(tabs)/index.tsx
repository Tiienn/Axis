import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotCard } from '@/components/bot-card';
import { BOT_LIST } from '@/constants/bots';
import { AxisColors, FontFamily } from '@/constants/theme';

export default function Home() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Axis</Text>
          <Text style={styles.tagline}>Your inner circle</Text>
        </View>
        <View style={styles.list}>
          {BOT_LIST.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onPress={() => router.push(`/chat/${bot.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AxisColors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  wordmark: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 44,
  },
  tagline: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
});
