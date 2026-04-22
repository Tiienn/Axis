-- Extend safety_events with enough context to audit events later.
-- event_type keeps serving as the severity tag ('crisis' | 'distress').

alter table public.safety_events
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade,
  add column if not exists message_content text;
