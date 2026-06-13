create or replace function public.update_active_ledger_book_name(next_name text)
returns public.ledger_books
language plpgsql
security definer
set search_path = public
as $$
declare
  current_book public.ledger_books%rowtype;
  normalized_name text;
begin
  normalized_name := regexp_replace(trim(coalesce(next_name, '')), '\s+', ' ', 'g');

  if normalized_name = '' then
    raise exception 'Ledger book name is required';
  end if;

  select books.*
  into current_book
  from public.ledger_books as books
  join public.profiles as profiles
    on profiles.active_book_id = books.id
  where profiles.id = auth.uid();

  if current_book.id is null then
    raise exception 'No active ledger book found for user %', auth.uid();
  end if;

  if not public.is_book_editor(current_book.id) then
    raise exception 'Only editors can rename the active ledger book';
  end if;

  update public.ledger_books as books
  set name = normalized_name
  where books.id = current_book.id
  returning books.* into current_book;

  return current_book;
end;
$$;

grant execute on function public.update_active_ledger_book_name(text) to authenticated;
