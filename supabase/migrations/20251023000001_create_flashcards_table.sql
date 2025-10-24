-- migration: create flashcards table
-- purpose: store user-generated flashcards with ai/manual source tracking
-- affected tables: flashcards (new)
-- dependencies: auth.users (supabase auth), generations table (foreign key)

-- create flashcards table
create table flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- create indexes for performance optimization
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_generation_id on flashcards(generation_id);

-- create trigger function to automatically update updated_at timestamp
create or replace function update_flashcards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- attach trigger to flashcards table
create trigger trigger_update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_flashcards_updated_at();

-- enable row level security
alter table flashcards enable row level security;

-- rls policy: allow anonymous users to select (read) - none allowed
-- rationale: flashcards are private, anonymous users should not see any flashcards
create policy "flashcards_select_anon"
  on flashcards
  for select
  to anon
  using (false);

-- rls policy: allow authenticated users to select (read) their own flashcards
-- rationale: users can only view their own flashcards
create policy "flashcards_select_authenticated"
  on flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow anonymous users to insert - none allowed
-- rationale: only authenticated users can create flashcards
create policy "flashcards_insert_anon"
  on flashcards
  for insert
  to anon
  with check (false);

-- rls policy: allow authenticated users to insert their own flashcards
-- rationale: users can only create flashcards associated with their own user_id
create policy "flashcards_insert_authenticated"
  on flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow anonymous users to update - none allowed
-- rationale: only authenticated users can modify flashcards
create policy "flashcards_update_anon"
  on flashcards
  for update
  to anon
  using (false);

-- rls policy: allow authenticated users to update their own flashcards
-- rationale: users can only modify their own flashcards
create policy "flashcards_update_authenticated"
  on flashcards
  for update
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow anonymous users to delete - none allowed
-- rationale: only authenticated users can delete flashcards
create policy "flashcards_delete_anon"
  on flashcards
  for delete
  to anon
  using (false);

-- rls policy: allow authenticated users to delete their own flashcards
-- rationale: users can only delete their own flashcards
create policy "flashcards_delete_authenticated"
  on flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

