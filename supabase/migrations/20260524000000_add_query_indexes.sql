create index if not exists items_user_date_idx
  on public.items (user_id, date desc);

create index if not exists items_folder_date_idx
  on public.items (folder_id, date desc);

create index if not exists items_user_total_idx
  on public.items (user_id, total desc);

create index if not exists folders_user_created_idx
  on public.folders (user_id, created_at asc);
