-- Add tags array to items table
alter table public.items add column if not exists tags text[] not null default '{}';

-- Create an index for faster array searching
create index if not exists idx_items_tags on public.items using gin(tags);
