create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  english text,
  tulu text,
  kannada text,
  telugu text,
  meaning text,
  example text,
  part_of_speech text not null default 'noun',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.entries alter column english drop not null;
alter table public.entries alter column tulu drop not null;
alter table public.entries alter column kannada drop not null;
alter table public.entries alter column telugu drop not null;
alter table public.entries alter column meaning drop not null;
alter table public.entries add column if not exists meaning text;
alter table public.entries add column if not exists example text;
alter table public.entries add column if not exists status text not null default 'draft';
alter table public.entries add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.entries add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.entries add column if not exists updated_at timestamptz not null default now();
alter table public.entries add column if not exists published_at timestamptz;

alter table public.entries drop constraint if exists entries_meaning_not_empty;
alter table public.entries drop constraint if exists entries_english_check;
alter table public.entries drop constraint if exists entries_tulu_check;
alter table public.entries drop constraint if exists entries_kannada_check;
alter table public.entries drop constraint if exists entries_telugu_check;
alter table public.entries add constraint entries_english_not_blank check (english is null or length(trim(english)) > 0);
alter table public.entries add constraint entries_tulu_not_blank check (tulu is null or length(trim(tulu)) > 0);
alter table public.entries add constraint entries_kannada_not_blank check (kannada is null or length(trim(kannada)) > 0);
alter table public.entries add constraint entries_telugu_not_blank check (telugu is null or length(trim(telugu)) > 0);
alter table public.entries add constraint entries_meaning_not_blank check (meaning is null or length(trim(meaning)) > 0);
update public.entries set status = case when english is not null and tulu is not null and kannada is not null and telugu is not null and meaning is not null then 'published' else 'draft' end;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_complete boolean not null default false,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_languages (
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null check (language_code in ('english', 'tulu', 'kannada', 'telugu')),
  primary key (user_id, language_code)
);

create table if not exists public.entry_notifications (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null check (language_code in ('english', 'tulu', 'kannada', 'telugu')),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (entry_id, recipient_id, language_code, is_read)
);

alter table public.entries enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.admin_languages enable row level security;
alter table public.entry_notifications enable row level security;

drop policy if exists "Entries are publicly readable" on public.entries;
create policy "Entries are publicly readable"
  on public.entries for select using (status = 'published' or exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can add entries" on public.entries;
create policy "Admins can add entries"
  on public.entries for insert with check (exists (select 1 from public.admin_users where user_id = auth.uid()) and created_by = auth.uid());

drop policy if exists "Admins can update entries" on public.entries;
create policy "Admins can update entries"
  on public.entries for update using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()) and updated_by = auth.uid());

drop policy if exists "Admins can delete entries" on public.entries;
create policy "Admins can delete entries"
  on public.entries for delete using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can view their membership" on public.admin_users;
create policy "Admins can view their membership"
  on public.admin_users for select using (user_id = auth.uid());

drop policy if exists "Admins can manage their profile" on public.admin_profiles;
create policy "Admins can manage their profile"
  on public.admin_profiles for all using (user_id = auth.uid() and exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage their languages" on public.admin_languages;
create policy "Admins can manage their languages"
  on public.admin_languages for all using (user_id = auth.uid() and exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can read their notifications" on public.entry_notifications;
create policy "Admins can read their notifications"
  on public.entry_notifications for select using (recipient_id = auth.uid());

drop policy if exists "Admins can mark notifications read" on public.entry_notifications;
create policy "Admins can mark notifications read"
  on public.entry_notifications for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "Admins can clear read notifications" on public.entry_notifications;
create policy "Admins can clear read notifications"
  on public.entry_notifications for delete using (recipient_id = auth.uid() and is_read = true);

create index if not exists entries_created_at_idx on public.entries (created_at desc);
create index if not exists entries_status_created_at_idx on public.entries (status, created_at desc);
create index if not exists entry_notifications_recipient_idx on public.entry_notifications (recipient_id, is_read, created_at desc);

create or replace function public.touch_entry_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at before update on public.entries
for each row execute function public.touch_entry_updated_at();

create or replace function public.publish_entry(entry_id uuid)
returns public.entries language plpgsql security invoker as $$
declare result public.entries;
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Only admins can publish entries';
  end if;
  update public.entries
  set status = 'published', published_at = coalesce(published_at, now()), updated_by = auth.uid()
  where id = entry_id and english is not null and tulu is not null and kannada is not null and telugu is not null and meaning is not null
  returning * into result;
  if result.id is null then raise exception 'Entry is missing a required field'; end if;
  return result;
end;
$$;

create or replace function public.create_missing_translation_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
declare language_name text;
begin
  if new.status = 'draft' then
    foreach language_name in array array['english', 'tulu', 'kannada', 'telugu'] loop
      if to_jsonb(new)->>language_name is null then
        insert into public.entry_notifications (entry_id, recipient_id, language_code)
        select new.id, al.user_id, language_name
        from public.admin_languages al
        join public.admin_profiles ap on ap.user_id = al.user_id
        where al.language_code = language_name and ap.notifications_enabled
        on conflict do nothing;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists entries_missing_translation_notifications on public.entries;
create trigger entries_missing_translation_notifications after insert or update of english, tulu, kannada, telugu, status on public.entries
for each row execute function public.create_missing_translation_notifications();