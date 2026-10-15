-- Global Shefu clean schema for a NEW Supabase project.
-- Non-destructive: this script does not drop tables or delete data.
-- Run in Supabase Dashboard -> SQL Editor on the intended new project.
-- All application database access is server-side through the service-role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser or commit it to GitHub.

begin;

create table if not exists public.puzzles (
  id text primary key,
  title text not null check (char_length(title) between 1 and 120),
  secret_answer text not null check (char_length(secret_answer) between 1 and 200),
  host_token text not null,
  host_name text not null check (char_length(host_name) between 1 and 60 and lower(btrim(host_name)) <> 'anonymous'),
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'solved'))
);

create table if not exists public.guesses (
  id bigint generated always as identity primary key,
  puzzle_id text not null references public.puzzles(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 60 and lower(btrim(player_name)) <> 'anonymous'),
  guess_text text not null check (char_length(guess_text) between 1 and 200),
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists guesses_puzzle_id_created_at_idx
  on public.guesses (puzzle_id, created_at desc);

create or replace function public.submit_guess(
  p_puzzle_id text,
  p_player_name text,
  p_guess_text text,
  p_is_correct boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  select p.status into current_status
  from public.puzzles as p
  where p.id = p_puzzle_id
  for update;

  if not found or current_status <> 'active' then
    return false;
  end if;

  if p_player_name is null
     or pg_catalog.btrim(p_player_name) = ''
     or pg_catalog.lower(pg_catalog.btrim(p_player_name)) = 'anonymous'
     or pg_catalog.char_length(pg_catalog.btrim(p_player_name)) > 60 then
    raise exception 'A valid nickname other than Anonymous is required';
  end if;

  insert into public.guesses (puzzle_id, player_name, guess_text, is_correct)
  values (
    p_puzzle_id,
    pg_catalog.btrim(p_player_name),
    p_guess_text,
    p_is_correct
  );

  if p_is_correct then
    update public.puzzles set status = 'solved' where id = p_puzzle_id;
  end if;

  return true;
end;
$$;

-- Defense in depth: browser roles have no direct table access and no RPC access.
alter table public.puzzles enable row level security;
alter table public.guesses enable row level security;

revoke all on table public.puzzles from anon, authenticated;
revoke all on table public.guesses from anon, authenticated;
grant all on table public.puzzles, public.guesses to service_role;
grant usage, select on sequence public.guesses_id_seq to service_role;
revoke all on function public.submit_guess(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_guess(text, text, text, boolean) to service_role;

commit;
