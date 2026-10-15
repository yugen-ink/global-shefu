-- Non-destructive nickname migration for an existing Global Shefu database.
-- Preserves existing puzzles and guesses. Run once in Supabase SQL Editor.
begin;

alter table public.puzzles add column if not exists host_name text;
update public.puzzles set host_name = 'Unknown host' where host_name is null or pg_catalog.btrim(host_name) = '';
alter table public.puzzles alter column host_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'puzzles_host_name_valid_check'
      and conrelid = 'public.puzzles'::regclass
  ) then
    alter table public.puzzles
      add constraint puzzles_host_name_valid_check
      check (char_length(host_name) between 1 and 60 and lower(btrim(host_name)) <> 'anonymous');
  end if;
end $$;

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
  values (p_puzzle_id, pg_catalog.btrim(p_player_name), p_guess_text, p_is_correct);

  if p_is_correct then
    update public.puzzles set status = 'solved' where id = p_puzzle_id;
  end if;

  return true;
end;
$$;

revoke all on function public.submit_guess(text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_guess(text, text, text, boolean) to service_role;

commit;
