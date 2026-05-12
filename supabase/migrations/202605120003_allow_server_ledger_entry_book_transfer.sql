create or replace function public.prevent_ledger_entry_identity_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.user_id is distinct from new.user_id then
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
