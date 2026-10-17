-- Keep ledger history when an author deletes their account.
alter table public.ledger_entries
drop constraint if exists ledger_entries_user_id_fkey;

alter table public.ledger_entries
add constraint ledger_entries_user_id_fkey
foreign key (user_id) references auth.users(id) on delete set null;

create or replace function public.prevent_ledger_entry_identity_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- ON DELETE SET NULL invokes this trigger from the parent FK trigger.
  -- Direct client updates must never clear or reassign an entry's author.
  if old.user_id is distinct from new.user_id
    and not (
      old.user_id is not null
      and new.user_id is null
      and pg_trigger_depth() > 1
    )
  then
    raise exception 'ledger entry user_id cannot be changed';
  end if;

  if old.book_id is distinct from new.book_id
    and coalesce(auth.role(), '') <> 'service_role'
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
  then
    raise exception 'ledger entry book_id cannot be changed';
  end if;

  return new;
end;
$$;
