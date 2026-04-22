import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Bot } from '@/constants/bots';
import { AxisColors, FontFamily } from '@/constants/theme';

import { BotAvatar } from './bot-avatar';

type Props = {
  bot: Bot;
  onPress: () => void;
  disabled?: boolean;
};

export function BotCard({ bot, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <BotAvatar letter={bot.letter} color={bot.color} />
      <View style={styles.text}>
        <Text style={styles.name}>{bot.name}</Text>
        <Text style={styles.role}>{bot.role}</Text>
      </View>
      {disabled ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={AxisColors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: AxisColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AxisColors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  text: {
    flex: 1,
  },
  name: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    fontSize: 20,
  },
  role: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    marginTop: 2,
  },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AxisColors.border,
    backgroundColor: AxisColors.background,
  },
  soonText: {
    color: AxisColors.textSecondary,
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
