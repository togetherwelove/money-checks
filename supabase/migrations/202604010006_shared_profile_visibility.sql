create or replace function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    auth.uid() = target_user_id
    or exists (
      select 1
      from public.ledger_book_members as current_member
      inner join public.ledger_book_members as target_member
        on current_member.book_id = target_member.book_id
      where current_member.user_id = auth.uid()
        and target_member.user_id = target_user_id
    );
$$;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_shared_member" on public.profiles;

create policy "profiles_select_shared_member" on public.profiles
for select using (public.can_view_profile(id));
