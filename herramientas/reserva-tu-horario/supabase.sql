-- Reserva tu horario · Acompañando a los misioneros
-- Lunes a viernes, 5:00-9:00 p. m., 4 familias por día (23-nov al 31-dic-2026)
-- Pegar completo en Supabase > proyecto "Organizador Henry" > SQL Editor > Run

create table if not exists public.agenda_reservas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fecha date not null,
  puesto smallint not null check (puesto between 1 and 4),
  familia text not null check (char_length(familia) between 2 and 80),
  token uuid not null default gen_random_uuid(),
  unique (fecha, puesto)
);
alter table public.agenda_reservas enable row level security;
revoke all on public.agenda_reservas from anon, authenticated;

create table if not exists public.agenda_config (
  id boolean primary key default true check (id),
  clave text not null
);
alter table public.agenda_config enable row level security;
revoke all on public.agenda_config from anon, authenticated;
insert into public.agenda_config (id, clave) values (true, 'CAMBIA_ESTA_CLAVE')
on conflict (id) do update set clave = excluded.clave;

-- Familias anotadas por día (público)
create or replace function public.agenda_ocupados()
returns table (fecha date, puesto smallint, familia text)
language sql security definer set search_path = public stable
as $$ select r.fecha, r.puesto, r.familia from public.agenda_reservas r order by 1, 2 $$;

-- Anotar una familia: toma el primer espacio libre del día (1 a 4)
create or replace function public.agenda_reservar(p_fecha date, p_familia text)
returns json language plpgsql security definer set search_path = public as $$
declare v_token uuid; v_nombre text := left(trim(coalesce(p_familia, '')), 80);
begin
  if p_fecha < date '2026-11-22' or p_fecha > date '2026-12-31' then raise exception 'fuera_de_rango'; end if;
  if extract(isodow from p_fecha) > 5 then raise exception 'dia_no_habil'; end if;
  if char_length(v_nombre) < 2 then raise exception 'familia'; end if;
  if exists (select 1 from public.agenda_reservas
             where fecha = p_fecha and lower(familia) = lower(v_nombre)) then
    raise exception 'repetida';
  end if;
  for i in 1..4 loop
    begin
      insert into public.agenda_reservas (fecha, puesto, familia)
      values (p_fecha, i, v_nombre) returning token into v_token;
      return json_build_object('token', v_token, 'puesto', i);
    exception when unique_violation then
      null; -- ese espacio ya está tomado, probar el siguiente
    end;
  end loop;
  raise exception 'lleno';
end $$;

-- Cancelar la propia inscripción (con el token guardado en el teléfono)
create or replace function public.agenda_cancelar(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin delete from public.agenda_reservas where token = p_token; return found; end $$;

-- Organizador: lista completa
create or replace function public.agenda_admin_lista(p_clave text)
returns table (id uuid, fecha date, puesto smallint, familia text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.agenda_config c where c.clave = p_clave) then raise exception 'no_autorizado'; end if;
  return query select r.id, r.fecha, r.puesto, r.familia, r.created_at
    from public.agenda_reservas r order by r.fecha, r.puesto;
end $$;

-- Organizador: quitar una inscripción
create or replace function public.agenda_admin_borrar(p_clave text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.agenda_config c where c.clave = p_clave) then raise exception 'no_autorizado'; end if;
  delete from public.agenda_reservas where id = p_id; return found;
end $$;

revoke execute on function public.agenda_ocupados() from public;
revoke execute on function public.agenda_reservar(date, text) from public;
revoke execute on function public.agenda_cancelar(uuid) from public;
revoke execute on function public.agenda_admin_lista(text) from public;
revoke execute on function public.agenda_admin_borrar(text, uuid) from public;
grant execute on function public.agenda_ocupados() to anon, authenticated;
grant execute on function public.agenda_reservar(date, text) to anon, authenticated;
grant execute on function public.agenda_cancelar(uuid) to anon, authenticated;
grant execute on function public.agenda_admin_lista(text) to anon, authenticated;
grant execute on function public.agenda_admin_borrar(text, uuid) to anon, authenticated;
