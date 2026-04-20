import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotAvatar } from '@/components/bot-avatar';
import { BOTS, type BotId } from '@/constants/bots';
import { AxisColors, FontFamily } from '@/constants/theme';

export default function Chat() {
  const { botId } = useLocalSearchParams<{ botId: BotId }>();
  const bot = BOTS[botId];

  if (!bot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.missing}>Unknown bot.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={AxisColors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <BotAvatar letter={bot.letter} color={bot.color} size={32} />
          <Text style={styles.name}>{bot.name}</Text>
        </View>
        <View style={styles.back} />
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Say hi to {bot.name}.</Text>
        <Text style={styles.emptySub}>{bot.role}. Conversations turn on in Week 3.</Text>
      </View>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${bot.name}…`}
          placeholderTextColor={AxisColors.muted}
          editable={false}
        />
        <View style={styles.sendButton}>
          <Ionicons name="arrow-up" size={18} color={AxisColors.muted} />
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: AxisColors.border,
    borderBottomWidth: 1,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serif,
    fontSize: 22,
    textAlign: 'center',
  },
  emptySub: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopColor: AxisColors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: AxisColors.surface,
    borderColor: AxisColors.border,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.sans,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AxisColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    padding: 20,
  },
});
