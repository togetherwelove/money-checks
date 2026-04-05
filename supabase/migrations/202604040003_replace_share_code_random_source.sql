create or replace function public.generate_share_code()
returns text
language plpgsql
as $$
declare
  next_code text;
begin
  loop
    next_code := upper(
      substr(
        md5(
          random()::text
          || clock_timestamp()::text
          || pg_backend_pid()::text
        ),
        1,
        16
      )
    );

    exit when not exists (
      select 1
      from public.ledger_books
      where share_code = next_code
    );
  end loop;

  return next_code;
end;
$$;
