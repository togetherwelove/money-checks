create or replace function public.get_ledger_book_members(target_book_id uuid)
returns table (
  user_id uuid,
  role text,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_book_member(target_book_id) then
    raise exception 'Access denied for ledger book %', target_book_id;
  end if;

  return query
  select
    members.user_id,
    members.role,
    profiles.display_name
  from public.ledger_book_members as members
  left join public.profiles as profiles
    on profiles.id = members.user_id
  where members.book_id = target_book_id
  order by
    case members.role
      when 'owner' then 0
      when 'editor' then 1
      else 2
    end,
    members.created_at,
    members.user_id;
end;
$$;

grant execute on function public.get_ledger_book_members(uuid) to authenticated;
