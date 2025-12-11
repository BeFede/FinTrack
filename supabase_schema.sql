-- Create categories table
create table if not exists public.categories (
  id text not null primary key,
  user_id uuid references auth.users not null,
  data jsonb not null,
  updated_at bigint not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Create policies
create policy "Users can view their own categories" on public.categories
  for select using (auth.uid() = user_id);

create policy "Users can insert their own categories" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own categories" on public.categories
  for update using (auth.uid() = user_id);

create policy "Users can delete their own categories" on public.categories
  for delete using (auth.uid() = user_id);
