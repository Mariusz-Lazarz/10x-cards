-- migration: create generation_error_logs table
-- purpose: log errors that occur during ai flashcard generation for debugging and analytics
-- affected tables: generation_error_logs (new)
-- dependencies: auth.users (supabase auth)

-- create generation_error_logs table
create table generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- create index for performance optimization
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- enable row level security
alter table generation_error_logs enable row level security;

-- rls policy: allow anonymous users to select (read) - none allowed
-- rationale: error logs are private, anonymous users should not see any error records
create policy "generation_error_logs_select_anon"
  on generation_error_logs
  for select
  to anon
  using (false);

-- rls policy: allow authenticated users to select (read) their own error logs
-- rationale: users can view their own error logs for troubleshooting
create policy "generation_error_logs_select_authenticated"
  on generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow anonymous users to insert - none allowed
-- rationale: only authenticated users can create error log records
create policy "generation_error_logs_insert_anon"
  on generation_error_logs
  for insert
  to anon
  with check (false);

-- rls policy: allow authenticated users to insert their own error logs
-- rationale: the system can log errors for authenticated user operations
create policy "generation_error_logs_insert_authenticated"
  on generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow anonymous users to update - none allowed
-- rationale: error logs are immutable, no updates should be allowed
create policy "generation_error_logs_update_anon"
  on generation_error_logs
  for update
  to anon
  using (false);

-- rls policy: allow authenticated users to update - none allowed
-- rationale: error logs are immutable records and should not be modified after creation
create policy "generation_error_logs_update_authenticated"
  on generation_error_logs
  for update
  to authenticated
  using (false);

-- rls policy: allow anonymous users to delete - none allowed
-- rationale: only authenticated users can delete error logs
create policy "generation_error_logs_delete_anon"
  on generation_error_logs
  for delete
  to anon
  using (false);

-- rls policy: allow authenticated users to delete their own error logs
-- rationale: users can delete their own error logs if desired
create policy "generation_error_logs_delete_authenticated"
  on generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

