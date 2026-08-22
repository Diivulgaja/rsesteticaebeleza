
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

alter table public.customers
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

alter table public.appointments
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_email text,
  add column if not exists can_review boolean not null default false,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists appointments_customer_user_id_idx on public.appointments(customer_user_id);
create index if not exists appointments_customer_id_idx on public.appointments(customer_id);
create index if not exists appointments_review_lookup_idx on public.appointments(customer_user_id, can_review);

drop trigger if exists trg_appointments_set_updated_at on public.appointments;
create trigger trg_appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

do $$
declare
  v_service_id_type text;
begin
  select case
    when data_type = 'bigint' then 'bigint'
    when data_type = 'integer' then 'integer'
    when udt_name = 'uuid' then 'uuid'
    else coalesce(udt_name, 'bigint')
  end
  into v_service_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'services' and column_name = 'id';

  if v_service_id_type is null then
    v_service_id_type := 'bigint';
  end if;

  if to_regclass('public.service_reviews') is null then
    execute format(
      'create table public.service_reviews (
        id uuid primary key default gen_random_uuid(),
        appointment_id uuid not null unique references public.appointments(id) on delete cascade,
        customer_id uuid not null references public.customers(id) on delete restrict,
        customer_user_id uuid not null references auth.users(id) on delete cascade,
        service_id %s references public.services(id) on delete restrict,
        rating integer not null check (rating between 1 and 5),
        title text,
        comment text,
        public_name text,
        status text not null default ''pending'' check (status in (''pending'',''approved'',''hidden'')),
        admin_reply text,
        replied_at timestamptz,
        is_featured boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )',
      v_service_id_type
    );
  end if;
end $$;

alter table public.service_reviews
  add column if not exists customer_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists comment text,
  add column if not exists public_name text,
  add column if not exists status text not null default 'pending',
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  begin
    alter table public.service_reviews
      drop constraint if exists service_reviews_status_check;
  exception when undefined_object then
    null;
  end;

  begin
    alter table public.service_reviews
      add constraint service_reviews_status_check
      check (status in ('pending','approved','hidden'));
  exception when duplicate_object then
    null;
  end;
end $$;

create index if not exists service_reviews_customer_user_id_idx on public.service_reviews(customer_user_id);
create index if not exists service_reviews_service_id_idx on public.service_reviews(service_id);
create index if not exists service_reviews_status_idx on public.service_reviews(status);
create index if not exists service_reviews_appointment_id_idx on public.service_reviews(appointment_id);

drop trigger if exists trg_service_reviews_set_updated_at on public.service_reviews;
create trigger trg_service_reviews_set_updated_at
before update on public.service_reviews
for each row execute function public.set_updated_at();

do $$
declare
  v_has_legacy_reviews boolean;
begin
  select to_regclass('public.reviews') is not null into v_has_legacy_reviews;
  if v_has_legacy_reviews then
    begin
      execute '
        insert into public.service_reviews (
          appointment_id,
          customer_id,
          service_id,
          rating,
          title,
          comment,
          public_name,
          status,
          is_featured,
          created_at
        )
        select
          r.appointment_id,
          r.customer_id,
          r.service_id,
          r.rating,
          nullif(r.title, ''''),
          r.comment,
          r.public_name,
          case
            when r.status in (''pending'',''approved'',''hidden'') then r.status
            else ''pending''
          end,
          coalesce(r.is_featured, false),
          coalesce(r.created_at, now())
        from public.reviews r
        where not exists (
          select 1 from public.service_reviews sr where sr.appointment_id = r.appointment_id
        )';
    exception when others then
      raise notice 'Migração opcional de public.reviews ignorada: %', sqlerrm;
    end;
  end if;
end $$;

create or replace function public.is_admin_user()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regclass('public.admin_users') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active, true) = true
  );
end;
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to anon, authenticated, service_role;

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
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.customers (
    auth_user_id,
    full_name,
    email,
    phone,
    avatar_url,
    auth_provider
  )
  values (
    v_user_id,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_avatar_url), ''),
    coalesce(nullif(trim(p_auth_provider), ''), 'google')
  )
  on conflict (auth_user_id)
  do update set
    full_name = coalesce(excluded.full_name, public.customers.full_name),
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

  select id
    into v_customer_id
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

create or replace function public.mark_appointment_completed_and_enable_review(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  if not public.is_admin_user() then
    raise exception 'Apenas admin pode concluir atendimento';
  end if;

  update public.appointments a
     set attendance_status = 'completed',
         status = coalesce(nullif(a.status, ''), 'confirmed'),
         can_review = true,
         reviewed_at = null,
         updated_at = now()
   where a.id = p_appointment_id
   returning * into v_row;

  if v_row.id is null then
    raise exception 'Agendamento não encontrado';
  end if;

  return v_row;
end;
$$;

revoke all on function public.mark_appointment_completed_and_enable_review(uuid) from public;
grant execute on function public.mark_appointment_completed_and_enable_review(uuid) to authenticated, service_role;

create or replace function public.release_appointment_review_for_customer(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  if not public.is_admin_user() then
    raise exception 'Apenas admin pode liberar avaliação';
  end if;

  update public.appointments a
     set attendance_status = coalesce(nullif(a.attendance_status, ''), 'completed'),
         status = coalesce(nullif(a.status, ''), 'confirmed'),
         can_review = true,
         reviewed_at = null,
         updated_at = now()
   where a.id = p_appointment_id
   returning * into v_row;

  if v_row.id is null then
    raise exception 'Agendamento não encontrado';
  end if;

  return v_row;
end;
$$;

revoke all on function public.release_appointment_review_for_customer(uuid) from public;
grant execute on function public.release_appointment_review_for_customer(uuid) to authenticated, service_role;

create or replace function public.release_appointment_review(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  select * into v_row
  from public.release_appointment_review_for_customer(p_appointment_id);

  return v_row;
end;
$$;

revoke all on function public.release_appointment_review(uuid) from public;
grant execute on function public.release_appointment_review(uuid) to authenticated, service_role;

create or replace function public.finalize_my_review_submission(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.appointments;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  update public.appointments a
     set reviewed_at = now(),
         can_review = false,
         updated_at = now()
   where a.id = p_appointment_id
     and a.customer_user_id = v_user_id
   returning * into v_row;

  if v_row.id is null then
    raise exception 'Agendamento não encontrado para esta conta';
  end if;

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
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'A nota deve estar entre 1 e 5';
  end if;

  select *
    into v_customer
  from public.customers c
  where c.auth_user_id = v_user_id
  limit 1;

  if v_customer.id is null then
    raise exception 'Cliente não encontrado para este usuário';
  end if;

  select *
    into v_appointment
  from public.appointments a
  where a.id = p_appointment_id
  limit 1;

  if v_appointment.id is null then
    raise exception 'Agendamento não encontrado';
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
    select 1
    from public.service_reviews sr
    where sr.appointment_id = p_appointment_id
  ) then
    raise exception 'Este atendimento já foi avaliado';
  end if;

  insert into public.service_reviews (
    appointment_id,
    customer_id,
    customer_user_id,
    service_id,
    rating,
    comment,
    public_name,
    status
  )
  values (
    v_appointment.id,
    v_customer.id,
    v_user_id,
    v_appointment.service_id,
    p_rating,
    nullif(trim(p_comment), ''),
    coalesce(nullif(trim(v_customer.full_name), ''), 'Cliente'),
    'pending'
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

drop view if exists public.public_service_reviews;

do $$
declare
  v_has_service_title boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'service_title'
  )
  into v_has_service_title;

  if v_has_service_title then
    execute $view$
      create view public.public_service_reviews as
      select
        sr.id,
        sr.appointment_id,
        sr.service_id,
        coalesce(s.title, a.service_title, 'Atendimento') as service_title,
        sr.rating,
        sr.title,
        sr.comment,
        sr.public_name,
        sr.admin_reply,
        sr.replied_at,
        sr.is_featured,
        coalesce(sr.public_name, c.full_name, 'Cliente') as customer_name,
        c.avatar_url as customer_avatar_url,
        sr.created_at
      from public.service_reviews sr
      left join public.appointments a on a.id = sr.appointment_id
      left join public.services s on s.id = sr.service_id
      left join public.customers c on c.id = sr.customer_id
      where sr.status = 'approved'
    $view$;
  else
    execute $view$
      create view public.public_service_reviews as
      select
        sr.id,
        sr.appointment_id,
        sr.service_id,
        coalesce(s.title, 'Atendimento') as service_title,
        sr.rating,
        sr.title,
        sr.comment,
        sr.public_name,
        sr.admin_reply,
        sr.replied_at,
        sr.is_featured,
        coalesce(sr.public_name, c.full_name, 'Cliente') as customer_name,
        c.avatar_url as customer_avatar_url,
        sr.created_at
      from public.service_reviews sr
      left join public.services s on s.id = sr.service_id
      left join public.customers c on c.id = sr.customer_id
      where sr.status = 'approved'
    $view$;
  end if;
end $$;

grant select on public.public_service_reviews to anon, authenticated;
grant select, insert, update on public.customers to authenticated;
grant select on public.appointments to authenticated;
grant select, insert on public.service_reviews to authenticated;

alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.service_reviews enable row level security;

drop policy if exists "customers_select_own_or_admin" on public.customers;
drop policy if exists "customers_insert_own_or_admin" on public.customers;
drop policy if exists "customers_update_own_or_admin" on public.customers;
drop policy if exists "appointments_select_own_or_admin" on public.appointments;
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
