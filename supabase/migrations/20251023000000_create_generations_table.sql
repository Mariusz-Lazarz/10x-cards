-- migration: create generations table
-- purpose: track ai generation metadata and statistics for flashcard generation
-- affected tables: generations (new)
-- dependencies: auth.users (supabase auth)

-- create generations table
create table generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create index for performance optimization
create index idx_generations_user_id on generations(user_id);

-- enable row level security
alter table generations enable row level security;

-- rls policy: allow anonymous users to select (read) - none allowed
-- rationale: generation records are private, anonymous users should not see any records
create policy "generations_select_anon"
  on generations
  for select
  to anon
  using (false);

-- rls policy: allow authenticated users to select (read) their own generation records
-- rationale: users can only view their own generation statistics
create policy "generations_select_authenticated"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow anonymous users to insert - none allowed
-- rationale: only authenticated users can create generation records
create policy "generations_insert_anon"
  on generations
  for insert
  to anon
  with check (false);

-- rls policy: allow authenticated users to insert their own generation records
-- rationale: users can only create generation records associated with their own user_id
create policy "generations_insert_authenticated"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow anonymous users to update - none allowed
-- rationale: only authenticated users can modify generation records
create policy "generations_update_anon"
  on generations
  for update
  to anon
  using (false);

-- rls policy: allow authenticated users to update their own generation records
-- rationale: users can modify their own generation records (e.g., updating acceptance counts)
create policy "generations_update_authenticated"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow anonymous users to delete - none allowed
-- rationale: only authenticated users can delete generation records
create policy "generations_delete_anon"
  on generations
  for delete
  to anon
  using (false);

-- rls policy: allow authenticated users to delete their own generation records
-- rationale: users can delete their own generation records if needed
create policy "generations_delete_authenticated"
  on generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

