begin;

alter table public.service_reviews
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists is_featured boolean not null default false;

create or replace function public.link_my_appointments_by_phone(
  p_phone text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_digits text;
  v_auth_customer public.customers;
  v_matched_customer public.customers;
  v_target_customer_id uuid;
  v_count integer := 0;
  v_email text;
  v_name text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_digits) < 10 then
    raise exception 'Informe o mesmo WhatsApp usado no agendamento';
  end if;

  select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')
    into v_email, v_name
  from auth.users u
  where u.id = v_user_id;

  select *
    into v_auth_customer
  from public.customers c
  where c.auth_user_id = v_user_id
  limit 1;

  select *
    into v_matched_customer
  from public.customers c
  where regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_digits
  order by c.updated_at desc nulls last, c.created_at desc nulls last
  limit 1;

  if v_matched_customer.id is not null and (v_matched_customer.auth_user_id is null or v_matched_customer.auth_user_id = v_user_id) then
    update public.customers
       set auth_user_id = v_user_id,
           full_name = coalesce(nullif(full_name, ''), nullif(v_name, ''), full_name),
           email = coalesce(nullif(email, ''), nullif(v_email, ''), email),
           phone = coalesce(phone, p_phone),
           auth_provider = coalesce(auth_provider, 'google'),
           updated_at = now()
     where id = v_matched_customer.id;

    v_target_customer_id := v_matched_customer.id;
  elsif v_auth_customer.id is not null then
    update public.customers
       set phone = coalesce(phone, p_phone),
           full_name = coalesce(nullif(full_name, ''), nullif(v_name, ''), full_name),
           email = coalesce(nullif(email, ''), nullif(v_email, ''), email),
           auth_provider = coalesce(auth_provider, 'google'),
           updated_at = now()
     where id = v_auth_customer.id;

    v_target_customer_id := v_auth_customer.id;
  else
    insert into public.customers (
      auth_user_id,
      full_name,
      email,
      phone,
      auth_provider
    )
    values (
      v_user_id,
      nullif(v_name, ''),
      nullif(v_email, ''),
      p_phone,
      'google'
    )
    returning id into v_target_customer_id;
  end if;

  update public.appointments a
     set customer_user_id = v_user_id,
         customer_id = coalesce(a.customer_id, v_target_customer_id),
         updated_at = now()
   where regexp_replace(coalesce(a.customer_phone, ''), '\D', '', 'g') = v_digits
     and (a.customer_user_id is null or a.customer_user_id = v_user_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.link_my_appointments_by_phone(text) from public;
grant execute on function public.link_my_appointments_by_phone(text) to authenticated, service_role;

drop view if exists public.public_service_reviews;
create or replace view public.public_service_reviews as
select
  sr.id,
  sr.appointment_id,
  sr.service_id,
  s.title as service_title,
  sr.rating,
  sr.comment,
  sr.admin_reply,
  sr.replied_at,
  sr.is_featured,
  c.full_name as customer_name,
  c.avatar_url as customer_avatar_url,
  sr.created_at
from public.service_reviews sr
join public.services s
  on s.id = sr.service_id
join public.customers c
  on c.id = sr.customer_id
where sr.status = 'approved';

grant select on public.public_service_reviews to anon, authenticated;

commit;
