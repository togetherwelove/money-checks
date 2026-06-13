alter function public.set_updated_at()
  set search_path = public;

alter function public.generate_share_code()
  set search_path = public;

alter function public.share_code_time_to_live()
  set search_path = public;

alter function public.join_request_pending_cooldown()
  set search_path = public;

alter function public.join_request_retry_cooldown()
  set search_path = public;
