create or replace function private.approve_ledger_book_join_request(target_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_book_id uuid;
  request_user_id uuid;
  request_join_resolution text := 'standard';
  requester_is_already_member boolean := false;
  approval_status text;
begin
  select requests.book_id, requests.requester_user_id, requests.join_resolution
  into request_book_id, request_user_id, request_join_resolution
  from public.ledger_book_join_requests as requests
  where requests.id = target_request_id
    and requests.status = 'pending';

  if request_book_id is null or request_user_id is null then
    raise exception 'Pending join request % was not found', target_request_id;
  end if;

  if not private.is_book_owner(request_book_id) then
    raise exception 'Only the book owner can approve join requests';
  end if;

  select exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = request_book_id
      and members.user_id = request_user_id
  )
  into requester_is_already_member;

  if not requester_is_already_member then
    insert into public.profiles (id)
    values (request_user_id)
    on conflict on constraint profiles_pkey do nothing;

    perform 1
    from public.profiles as profiles
    where profiles.id = request_user_id
    for update;

    approval_status := private.resolve_ledger_book_join_approval_status(
      request_user_id,
      request_book_id,
      request_join_resolution
    );

    if approval_status not in (
      'can_approve',
      'can_approve_with_personal_book_merge',
      'can_approve_with_personal_book_discard'
    ) then
      perform private.raise_ledger_book_join_not_allowed(approval_status);
    end if;

    insert into public.ledger_book_members (book_id, user_id, role)
    values (request_book_id, request_user_id, 'editor')
    on conflict (book_id, user_id) do nothing;

    update public.profiles
    set active_book_id = request_book_id
    where id = request_user_id;

    if approval_status = 'can_approve_with_personal_book_merge' then
      perform private.merge_owned_ledger_books_into_target(request_user_id, request_book_id);
    elsif approval_status = 'can_approve_with_personal_book_discard' then
      perform private.discard_owned_personal_ledger_books_before_join(
        request_user_id,
        request_book_id
      );
    end if;
  else
    update public.profiles
    set active_book_id = request_book_id
    where id = request_user_id;
  end if;

  update public.ledger_book_join_requests
  set status = 'approved',
      reviewed_at = timezone('utc', now()),
      reviewed_by = auth.uid()
  where id = target_request_id;

  return request_book_id;
end;
$$;
