create table if not exists public.expense_daily_folder_totals (
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  date date not null,
  item_count integer not null default 0,
  total numeric(12, 2) not null default 0,
  primary key (user_id, folder_id, date)
);

insert into public.expense_daily_folder_totals (
  user_id,
  folder_id,
  date,
  item_count,
  total
)
select
  user_id,
  folder_id,
  date,
  count(*)::integer as item_count,
  coalesce(sum(total), 0)::numeric(12, 2) as total
from public.items
group by user_id, folder_id, date
on conflict (user_id, folder_id, date) do update
set
  item_count = excluded.item_count,
  total = excluded.total;

create or replace function public.apply_expense_daily_folder_total_delta(
  p_user_id uuid,
  p_folder_id uuid,
  p_date date,
  p_item_delta integer,
  p_total_delta numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.expense_daily_folder_totals (
    user_id,
    folder_id,
    date,
    item_count,
    total
  )
  values (
    p_user_id,
    p_folder_id,
    p_date,
    p_item_delta,
    p_total_delta
  )
  on conflict (user_id, folder_id, date) do update
  set
    item_count = public.expense_daily_folder_totals.item_count + excluded.item_count,
    total = public.expense_daily_folder_totals.total + excluded.total;

  delete from public.expense_daily_folder_totals
  where user_id = p_user_id
    and folder_id = p_folder_id
    and date = p_date
    and item_count <= 0;
end;
$$;

create or replace function public.maintain_expense_daily_folder_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.apply_expense_daily_folder_total_delta(
      new.user_id,
      new.folder_id,
      new.date,
      1,
      coalesce(new.total, 0)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.apply_expense_daily_folder_total_delta(
      old.user_id,
      old.folder_id,
      old.date,
      -1,
      -coalesce(old.total, 0)
    );
    perform public.apply_expense_daily_folder_total_delta(
      new.user_id,
      new.folder_id,
      new.date,
      1,
      coalesce(new.total, 0)
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.apply_expense_daily_folder_total_delta(
      old.user_id,
      old.folder_id,
      old.date,
      -1,
      -coalesce(old.total, 0)
    );
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists maintain_expense_daily_folder_totals_on_items on public.items;

create trigger maintain_expense_daily_folder_totals_on_items
after insert or update or delete on public.items
for each row execute function public.maintain_expense_daily_folder_totals();

create index if not exists idx_items_user_date_created_desc
on public.items (user_id, date desc, created_at desc);

create index if not exists idx_items_folder_date_created_desc
on public.items (folder_id, date desc, created_at desc);

create index if not exists idx_items_user_total_desc
on public.items (user_id, total desc);

create index if not exists idx_expense_daily_folder_totals_user_date
on public.expense_daily_folder_totals (user_id, date);

create index if not exists idx_expense_daily_folder_totals_folder_date
on public.expense_daily_folder_totals (folder_id, date);
