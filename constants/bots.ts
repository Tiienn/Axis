import { BotAccents } from './theme';

export type BotId = 'hitch' | 'mira' | 'jean' | 'rex';

export type Bot = {
  id: BotId;
  name: string;
  role: string;
  letter: string;
  color: string;
  temperature: number;
};

export const BOTS: Record<BotId, Bot> = {
  hitch: {
    id: 'hitch',
    name: 'Hitch',
    role: 'Dating coach',
    letter: 'H',
    color: BotAccents.hitch,
    temperature: 0.9,
  },
  mira: {
    id: 'mira',
    name: 'Mira',
    role: 'Emotional support',
    letter: 'M',
    color: BotAccents.mira,
    temperature: 0.6,
  },
  jean: {
    id: 'jean',
    name: 'Jean',
    role: 'Sex therapist',
    letter: 'J',
    color: BotAccents.jean,
    temperature: 0.4,
  },
  rex: {
    id: 'rex',
    name: 'Rex',
    role: 'Accountability coach',
    letter: 'R',
    color: BotAccents.rex,
    temperature: 0.7,
  },
};

export const BOT_LIST: Bot[] = [BOTS.hitch, BOTS.mira, BOTS.jean, BOTS.rex];
