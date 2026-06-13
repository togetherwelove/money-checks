create or replace function public.generate_share_code()
returns text
language plpgsql
as $$
declare
  next_code text;
begin
  loop
    next_code := upper(encode(gen_random_bytes(8), 'hex'));
    exit when not exists (
      select 1
      from public.ledger_books
      where share_code = next_code
    );
  end loop;

  return next_code;
end;
$$;

alter table public.ledger_books
  drop constraint if exists ledger_books_share_code_format;

update public.ledger_books
set share_code = public.generate_share_code()
where share_code is null
   or length(trim(share_code)) <> 16
   or share_code !~ '^[A-F0-9]{16}$';

alter table public.ledger_books
  add constraint ledger_books_share_code_format
  check (share_code ~ '^[A-F0-9]{16}$');
