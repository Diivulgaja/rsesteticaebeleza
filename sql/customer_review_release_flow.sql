begin;

create or replace function public.complete_appointment_without_releasing_review(
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
         status = 'confirmed',
         confirmed_at = coalesce(a.confirmed_at, now()),
         can_review = false,
         updated_at = now()
   where a.id = p_appointment_id
   returning * into v_row;

  if v_row.id is null then
    raise exception 'Agendamento não encontrado';
  end if;

  return v_row;
end;
$$;

revoke all on function public.complete_appointment_without_releasing_review(uuid) from public;
grant execute on function public.complete_appointment_without_releasing_review(uuid) to authenticated, service_role;

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
     set attendance_status = 'completed',
         status = 'confirmed',
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

commit;
