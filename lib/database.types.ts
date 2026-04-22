export type ProfileJson = {
  name?: string;
  situation?: string;
  goal?: string;
};

export type UserRow = {
  id: string;
  email: string;
  subscription_status: 'free' | 'pro' | 'lifetime';
  profile_json: ProfileJson;
  created_at: string;
};

export type BotRow = {
  id: string;
  name: string;
  system_prompt: string;
  prompt_version: number;
  temperature: number;
  accent_color: string;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  bot_id: string;
  memory_summary: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  created_at: string;
};

export type SafetyEventRow = {
  id: string;
  user_id: string;
  event_type: 'crisis' | 'distress';
  conversation_id: string | null;
  message_content: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & { id: string; email: string };
        Update: Partial<UserRow>;
        Relationships: [];
      };
      bots: {
        Row: BotRow;
        Insert: Partial<BotRow>;
        Update: Partial<BotRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Partial<ConversationRow> & { user_id: string; bot_id: string };
        Update: Partial<ConversationRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Partial<MessageRow> & { conversation_id: string; role: 'user' | 'assistant'; content: string };
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      safety_events: {
        Row: SafetyEventRow;
        Insert: Partial<SafetyEventRow> & { user_id: string; event_type: 'crisis' | 'distress' };
        Update: Partial<SafetyEventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
