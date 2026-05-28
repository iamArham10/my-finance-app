-- Recurring transactions
create table public.recurring_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  folder_id     uuid not null references public.folders(id) on delete cascade,
  name          text not null,
  price         numeric(12,2) not null,
  quantity      numeric(10,3) not null default 1,
  unit          text not null default 'pcs',
  note          text,
  frequency     text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date date not null,
  is_active     boolean not null default true,
  created_at    timestamptz default now()
);

alter table public.recurring_transactions enable row level security;

create policy "Users manage own recurring transactions"
  on public.recurring_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Savings goals
create table public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  icon           text default '🎯',
  target_amount  numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline       date,
  created_at     timestamptz default now()
);

alter table public.savings_goals enable row level security;

create policy "Users manage own savings goals"
  on public.savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Budget rollover: add a column to folders to opt-in
alter table public.folders add column if not exists rollover_enabled boolean not null default false;
