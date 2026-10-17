-- Run in a transaction and roll back: no application rows are modified.
begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ledger_entries'::regclass
      and conname = 'ledger_entries_user_id_fkey'
      and confdeltype = 'n'
  ) then
    raise exception 'Ledger author FK must use ON DELETE SET NULL';
  end if;
end;
$$;

create temporary table identity_test_users (id uuid primary key);
create temporary table identity_test_entries (
  id integer primary key,
  user_id uuid references identity_test_users(id) on delete set null,
  book_id uuid not null,
  content text not null
);
create trigger identity_test_guard
before update on identity_test_entries
for each row execute function public.prevent_ledger_entry_identity_update();

insert into identity_test_users values ('00000000-0000-0000-0000-000000000001');
insert into identity_test_entries values (
  1, '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 'original'
);
grant select, update on identity_test_entries to authenticated;
set local role authenticated;

do $$
begin
  update identity_test_entries set content = 'edited' where id = 1;

  begin
    update identity_test_entries set user_id = null where id = 1;
    raise exception 'Direct author clearing was allowed';
  exception when raise_exception then
    if sqlerrm <> 'ledger entry user_id cannot be changed' then raise; end if;
  end;

  begin
    update identity_test_entries
    set user_id = '00000000-0000-0000-0000-000000000003' where id = 1;
    raise exception 'Author reassignment was allowed';
  exception when raise_exception then
    if sqlerrm <> 'ledger entry user_id cannot be changed' then raise; end if;
  end;

  begin
    update identity_test_entries
    set book_id = '00000000-0000-0000-0000-000000000003' where id = 1;
    raise exception 'Client book transfer was allowed';
  exception when raise_exception then
    if sqlerrm <> 'ledger entry book_id cannot be changed' then raise; end if;
  end;
end;
$$;

reset role;
delete from identity_test_users;

do $$
begin
  if not exists (
    select 1 from identity_test_entries
    where id = 1 and user_id is null and content = 'edited'
  ) then
    raise exception 'Account deletion did not preserve the entry';
  end if;
end;
$$;

set local role authenticated;
do $$
begin
  begin
    update identity_test_entries
    set user_id = '00000000-0000-0000-0000-000000000003' where id = 1;
    raise exception 'A deleted author could be reassigned';
  exception when raise_exception then
    if sqlerrm <> 'ledger entry user_id cannot be changed' then raise; end if;
  end;
end;
$$;
reset role;

update identity_test_entries
set book_id = '00000000-0000-0000-0000-000000000003' where id = 1;
select 'entry identity checks passed' as result;
rollback;
