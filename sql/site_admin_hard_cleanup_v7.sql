begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key,
  full_name text,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  auth_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists auth_provider text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists customers_auth_user_id_key on public.customers(auth_user_id) where auth_user_id is not null;
create index if not exists customers_phone_idx on public.customers(phone);

drop trigger if exists trg_customers_set_updated_at on public.customers;
create trigger trg_customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

alter table if exists public.appointments
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists can_review boolean not null default false,
  add column if not exists reviewed_at timestamptz,
  add column if not exists customer_email text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists appointments_customer_user_id_idx on public.appointments(customer_user_id);
create index if not exists appointments_customer_id_idx on public.appointments(customer_id);
create index if not exists appointments_customer_phone_idx on public.appointments(customer_phone);
create index if not exists appointments_booking_date_idx on public.appointments(booking_date);

drop trigger if exists trg_appointments_set_updated_at on public.appointments;
create trigger trg_appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table if exists public.appointments
  alter column id set default gen_random_uuid();

alter table if exists public.service_reviews
  add column if not exists title text,
  add column if not exists public_name text,
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'pending';

drop trigger if exists trg_service_reviews_set_updated_at on public.service_reviews;
create trigger trg_service_reviews_set_updated_at
before update on public.service_reviews
for each row execute function public.set_updated_at();

alter table if exists public.service_reviews
  alter column id set default gen_random_uuid();

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'service_reviews'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.service_reviews drop constraint %I', r.conname);
  end loop;
exception when undefined_table then
  null;
end $$;

alter table if exists public.service_reviews
  add constraint service_reviews_status_check
  check (status in ('pending', 'approved', 'hidden', 'rejected')) not valid;

alter table if exists public.service_reviews validate constraint service_reviews_status_check;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active, true) = true
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to anon, authenticated, service_role;

do $$
declare
  r record;
begin
  for r in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'upsert_my_customer_profile',
        'link_my_appointments_by_phone',
        'create_my_service_review',
        'finalize_my_review_submission',
        'create_public_booking',
        'list_available_slots'
      )
  loop
    execute 'drop function if exists ' || r.signature || ' cascade';
  end loop;
end $$;

create or replace function public.upsert_my_customer_profile(
  p_full_name text default null,
  p_email text default null,
  p_phone text default null,
  p_avatar_url text default null,
  p_auth_provider text default 'google'
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_customer public.customers;
  v_phone text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_phone := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');

  insert into public.customers (auth_user_id, full_name, email, phone, avatar_url, auth_provider)
  values (
    v_user_id,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_email), ''),
    v_phone,
    nullif(trim(p_avatar_url), ''),
    coalesce(nullif(trim(p_auth_provider), ''), 'google')
  )
  on conflict (auth_user_id)
  do update
     set full_name = coalesce(excluded.full_name, public.customers.full_name),
         email = coalesce(excluded.email, public.customers.email),
         phone = coalesce(excluded.phone, public.customers.phone),
         avatar_url = coalesce(excluded.avatar_url, public.customers.avatar_url),
         auth_provider = coalesce(excluded.auth_provider, public.customers.auth_provider),
         updated_at = now()
  returning * into v_customer;

  return v_customer;
end;
$$;

revoke all on function public.upsert_my_customer_profile(text, text, text, text, text) from public;
grant execute on function public.upsert_my_customer_profile(text, text, text, text, text) to authenticated, service_role;

create or replace function public.link_my_appointments_by_phone(p_phone text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_digits text;
  v_customer_id uuid;
  v_count integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_digits) < 10 then
    raise exception 'Informe o mesmo WhatsApp usado no agendamento';
  end if;

  select id into v_customer_id
  from public.customers
  where auth_user_id = v_user_id
  limit 1;

  update public.appointments a
     set customer_user_id = v_user_id,
         customer_id = coalesce(a.customer_id, v_customer_id),
         updated_at = now()
   where regexp_replace(coalesce(a.customer_phone, ''), '\D', '', 'g') = v_digits
     and (a.customer_user_id is null or a.customer_user_id = v_user_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.link_my_appointments_by_phone(text) from public;
grant execute on function public.link_my_appointments_by_phone(text) to authenticated, service_role;

create or replace function public.finalize_my_review_submission(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  update public.appointments
     set reviewed_at = now(),
         can_review = false,
         updated_at = now()
   where id = p_appointment_id
     and customer_user_id = auth.uid()
   returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.finalize_my_review_submission(uuid) from public;
grant execute on function public.finalize_my_review_submission(uuid) to authenticated, service_role;

create or replace function public.create_my_service_review(
  p_appointment_id uuid,
  p_rating integer,
  p_comment text default null
)
returns public.service_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_customer public.customers;
  v_appointment public.appointments;
  v_review public.service_reviews;
  v_customer_phone text;
  v_appointment_phone text;
  v_title text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'A nota deve estar entre 1 e 5';
  end if;

  select * into v_customer
  from public.customers
  where auth_user_id = v_user_id
  limit 1;

  if v_customer.id is null then
    raise exception 'Cliente não encontrado para este usuário';
  end if;

  select * into v_appointment
  from public.appointments
  where id = p_appointment_id
  limit 1;

  if v_appointment.id is null then
    raise exception 'Agendamento não encontrado';
  end if;

  v_customer_phone := regexp_replace(coalesce(v_customer.phone, ''), '\D', '', 'g');
  v_appointment_phone := regexp_replace(coalesce(v_appointment.customer_phone, ''), '\D', '', 'g');

  if v_appointment.customer_user_id is distinct from v_user_id then
    if v_appointment.customer_user_id is null and (
      v_appointment.customer_id = v_customer.id
      or (v_customer_phone <> '' and v_customer_phone = v_appointment_phone)
    ) then
      update public.appointments
         set customer_user_id = v_user_id,
             customer_id = coalesce(customer_id, v_customer.id),
             updated_at = now()
       where id = v_appointment.id;

      select * into v_appointment
      from public.appointments
      where id = p_appointment_id
      limit 1;
    end if;
  end if;

  if v_appointment.customer_user_id is distinct from v_user_id then
    raise exception 'Você não pode avaliar este atendimento';
  end if;

  if coalesce(v_appointment.attendance_status, '') not in ('completed', 'attended') then
    raise exception 'Avaliação só é liberada após atendimento concluído';
  end if;

  if coalesce(v_appointment.can_review, false) = false then
    raise exception 'Avaliação ainda não liberada';
  end if;

  if exists (
    select 1 from public.service_reviews sr where sr.appointment_id = p_appointment_id
  ) then
    raise exception 'Este atendimento já foi avaliado';
  end if;

  v_title := left(coalesce(nullif(trim(split_part(coalesce(p_comment, ''), '—', 1)), ''), 'Experiência compartilhada'), 120);

  insert into public.service_reviews (
    appointment_id,
    customer_id,
    customer_user_id,
    service_id,
    rating,
    title,
    comment,
    public_name,
    status,
    is_featured
  )
  values (
    v_appointment.id,
    v_customer.id,
    v_user_id,
    v_appointment.service_id,
    p_rating,
    v_title,
    nullif(trim(p_comment), ''),
    coalesce(nullif(trim(v_customer.full_name), ''), 'Cliente'),
    'pending',
    false
  )
  returning * into v_review;

  update public.appointments
     set reviewed_at = now(),
         can_review = false,
         updated_at = now()
   where id = v_appointment.id;

  return v_review;
end;
$$;

revoke all on function public.create_my_service_review(uuid, integer, text) from public;
grant execute on function public.create_my_service_review(uuid, integer, text) to authenticated, service_role;

create or replace function public.list_available_slots(
  p_service_id text,
  p_booking_date date
)
returns table(slot_time text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_minutes integer := 60;
  v_slot time;
  v_start_time time := time '09:00';
  v_end_time time := time '18:00';
  v_weekday integer;
begin
  if p_booking_date is null then
    return;
  end if;

  begin
    select coalesce(duration_minutes, 60)
      into v_duration_minutes
    from public.services
    where id::text = p_service_id
    limit 1;
  exception when undefined_table or undefined_column then
    v_duration_minutes := 60;
  end;

  v_weekday := extract(dow from p_booking_date);

  begin
    select bh.start_time, bh.end_time
      into v_start_time, v_end_time
    from public.business_hours bh
    where bh.weekday = v_weekday
      and coalesce(bh.is_active, true) = true
    limit 1;
  exception when undefined_table or undefined_column then
    null;
  end;

  v_slot := v_start_time;
  while v_slot < v_end_time loop
    if not exists (
      select 1
      from public.appointments a
      where a.start_at < timezone('America/Sao_Paulo', ((p_booking_date::text || ' ' || (v_slot + make_interval(mins => v_duration_minutes))::time::text)::timestamp))
        and coalesce(a.end_at, a.start_at + interval '1 minute') > timezone('America/Sao_Paulo', ((p_booking_date::text || ' ' || v_slot::text)::timestamp))
        and coalesce(a.status, 'pending') not in ('cancelled', 'expired')
    ) then
      if p_booking_date > current_date or v_slot::text >= to_char(now() at time zone 'America/Sao_Paulo', 'HH24:MI:SS') then
        slot_time := to_char(v_slot, 'HH24:MI');
        return next;
      end if;
    end if;

    v_slot := v_slot + interval '30 minutes';
  end loop;
end;
$$;

grant execute on function public.list_available_slots(text, date) to anon, authenticated, service_role;

create or replace function public.create_public_booking(
  p_service_id text,
  p_booking_date date,
  p_slot_time text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid;
  v_service_id public.services.id%type;
  v_duration_minutes integer := 60;
  v_price numeric := 0;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_payload jsonb;
  v_row public.appointments;
  v_booking_reference text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
begin
  if v_user_id is null then
    raise exception 'Faça login para concluir o agendamento';
  end if;

  select id, coalesce(duration_minutes, 60), coalesce(price, 0)
    into v_service_id, v_duration_minutes, v_price
  from public.services
  where id::text = p_service_id
  limit 1;

  if v_service_id is null then
    raise exception 'Serviço não encontrado';
  end if;

  v_start_at := timezone('America/Sao_Paulo', ((p_booking_date::text || ' ' || p_slot_time)::timestamp));
  v_end_at := v_start_at + make_interval(mins => v_duration_minutes);

  if exists (
    select 1
    from public.appointments a
    where a.start_at < v_end_at
      and coalesce(a.end_at, a.start_at + interval '1 minute') > v_start_at
      and coalesce(a.status, 'pending') not in ('cancelled', 'expired')
  ) then
    raise exception 'Esse horário acabou de ser reservado. Escolha um novo horário.';
  end if;

  select id into v_customer_id
  from public.customers
  where auth_user_id = v_user_id
  limit 1;

  v_payload := jsonb_strip_nulls(jsonb_build_object(
    'id', to_jsonb(gen_random_uuid()),
    'booking_reference', v_booking_reference,
    'booking_date', p_booking_date,
    'start_at', v_start_at,
    'end_at', v_end_at,
    'status', 'pending',
    'source', 'site',
    'customer_name', nullif(trim(p_customer_name), ''),
    'customer_phone', nullif(trim(p_customer_phone), ''),
    'customer_notes', nullif(trim(p_customer_notes), ''),
    'price', v_price,
    'quoted_price', v_price,
    'final_price', v_price,
    'payment_status', 'pending',
    'attendance_status', 'scheduled',
    'service_id', to_jsonb(v_service_id),
    'customer_user_id', v_user_id,
    'customer_id', v_customer_id
  ));

  insert into public.appointments
  select * from jsonb_populate_record(null::public.appointments, v_payload)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_public_booking(text, date, text, text, text, text) from public;
grant execute on function public.create_public_booking(text, date, text, text, text, text) to authenticated, service_role;

drop view if exists public.public_booking_availability;
create view public.public_booking_availability as
select
  id,
  booking_date,
  start_at,
  end_at,
  status
from public.appointments
where coalesce(status, 'pending') not in ('cancelled', 'expired');

grant select on public.public_booking_availability to anon, authenticated;

drop view if exists public.public_service_reviews;

do $$
declare
  has_service_title boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'service_title'
  ) into has_service_title;

  if has_service_title then
    execute $view$
      create view public.public_service_reviews as
      select
        sr.id,
        sr.appointment_id,
        sr.customer_id,
        sr.service_id,
        sr.rating,
        sr.title,
        sr.comment,
        coalesce(nullif(sr.public_name, ''), c.full_name, 'Cliente') as public_name,
        coalesce(nullif(sr.public_name, ''), c.full_name, 'Cliente') as customer_name,
        c.avatar_url as customer_avatar_url,
        coalesce(s.title, a.service_title, 'Atendimento') as service_title,
        sr.admin_reply,
        sr.replied_at,
        sr.is_featured,
        sr.status,
        sr.created_at,
        sr.updated_at
      from public.service_reviews sr
      left join public.customers c on c.id = sr.customer_id
      left join public.services s on s.id = sr.service_id
      left join public.appointments a on a.id = sr.appointment_id
      where sr.status = 'approved'
    $view$;
  else
    execute $view$
      create view public.public_service_reviews as
      select
        sr.id,
        sr.appointment_id,
        sr.customer_id,
        sr.service_id,
        sr.rating,
        sr.title,
        sr.comment,
        coalesce(nullif(sr.public_name, ''), c.full_name, 'Cliente') as public_name,
        coalesce(nullif(sr.public_name, ''), c.full_name, 'Cliente') as customer_name,
        c.avatar_url as customer_avatar_url,
        coalesce(s.title, 'Atendimento') as service_title,
        sr.admin_reply,
        sr.replied_at,
        sr.is_featured,
        sr.status,
        sr.created_at,
        sr.updated_at
      from public.service_reviews sr
      left join public.customers c on c.id = sr.customer_id
      left join public.services s on s.id = sr.service_id
      where sr.status = 'approved'
    $view$;
  end if;
end $$;

grant select on public.public_service_reviews to anon, authenticated;

grant select, insert, update on public.customers to authenticated, service_role;
grant select on public.appointments to authenticated, service_role;
grant update on public.appointments to authenticated, service_role;
grant select, insert, update, delete on public.service_reviews to authenticated, service_role;
grant select on public.services to anon, authenticated, service_role;
grant select on public.business_hours to anon, authenticated, service_role;

alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.service_reviews enable row level security;

drop policy if exists "customers_select_own_or_admin" on public.customers;
drop policy if exists "customers_insert_own_or_admin" on public.customers;
drop policy if exists "customers_update_own_or_admin" on public.customers;
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
drop policy if exists "appointments_update_own_or_admin" on public.appointments;
drop policy if exists "service_reviews_select_own_or_admin" on public.service_reviews;
drop policy if exists "service_reviews_insert_own" on public.service_reviews;
drop policy if exists "service_reviews_update_admin_only" on public.service_reviews;
drop policy if exists "service_reviews_delete_admin_only" on public.service_reviews;

create policy "customers_select_own_or_admin"
on public.customers
for select to authenticated
using (auth_user_id = auth.uid() or (select public.is_admin_user()));

create policy "customers_insert_own_or_admin"
on public.customers
for insert to authenticated
with check (auth_user_id = auth.uid() or (select public.is_admin_user()));

create policy "customers_update_own_or_admin"
on public.customers
for update to authenticated
using (auth_user_id = auth.uid() or (select public.is_admin_user()))
with check (auth_user_id = auth.uid() or (select public.is_admin_user()));

create policy "appointments_select_own_or_admin"
on public.appointments
for select to authenticated
using (customer_user_id = auth.uid() or (select public.is_admin_user()));

create policy "appointments_update_own_or_admin"
on public.appointments
for update to authenticated
using (customer_user_id = auth.uid() or (select public.is_admin_user()))
with check (customer_user_id = auth.uid() or (select public.is_admin_user()));

create policy "service_reviews_select_own_or_admin"
on public.service_reviews
for select to authenticated
using (customer_user_id = auth.uid() or (select public.is_admin_user()));

create policy "service_reviews_insert_own"
on public.service_reviews
for insert to authenticated
with check (customer_user_id = auth.uid());

create policy "service_reviews_update_admin_only"
on public.service_reviews
for update to authenticated
using ((select public.is_admin_user()))
with check ((select public.is_admin_user()));

create policy "service_reviews_delete_admin_only"
on public.service_reviews
for delete to authenticated
using ((select public.is_admin_user()));

commit;
