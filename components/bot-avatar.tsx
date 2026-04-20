import { StyleSheet, Text, View } from 'react-native';

import { AxisColors, FontFamily } from '@/constants/theme';

type Props = {
  letter: string;
  color: string;
  size?: number;
};

export function BotAvatar({ letter, color, size = 56 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.48 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: AxisColors.textPrimary,
    fontFamily: FontFamily.serifBold,
    lineHeight: undefined,
  },
});
