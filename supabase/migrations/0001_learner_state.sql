-- Per-user learner state (progress / flashcards / worksheets), one JSON blob per key.
-- Run once in the Supabase SQL editor. Row-level security limits every row to its owner.

create table public.learner_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null check (key in ('progress', 'flashcards', 'worksheets')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint learner_state_data_size check (pg_column_size(data) <= 262144)
);

alter table public.learner_state enable row level security;
revoke all on public.learner_state from anon;

create policy "select own" on public.learner_state
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own" on public.learner_state
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own" on public.learner_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on public.learner_state
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create trigger learner_state_touch
  before update on public.learner_state
  for each row execute function public.set_updated_at();
