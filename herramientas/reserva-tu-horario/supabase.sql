-- Pegar completo en Supabase > proyecto "Organizador Henry" > SQL Editor > Run
create table if not exists public.agenda_reservas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fecha date not null,
  hora smallint not null check (hora between 17 and 20),
  familia text not null check (char_length(familia) between 2 and 80),
  token uuid not null default gen_random_uuid(),
  unique (fecha, hora)
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

create or replace function public.agenda_ocupados()
returns table (fecha date, hora smallint, familia text)
language sql security definer set search_path = public stable
as $$ select r.fecha, r.hora, r.familia from public.agenda_reservas r order by 1, 2 $$;

create or replace function public.agenda_reservar(p_fecha date, p_hora int, p_familia text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_token uuid;
begin
  if p_fecha < date '2026-11-22' or p_fecha > date '2026-12-31' then raise exception 'fuera_de_rango'; end if;
  if extract(isodow from p_fecha) > 5 then raise exception 'dia_no_habil'; end if;
  if p_hora < 17 or p_hora > 20 then raise exception 'hora_no_valida'; end if;
  if char_length(trim(coalesce(p_familia,''))) < 2 then raise exception 'familia'; end if;
  begin
    insert into public.agenda_reservas (fecha, hora, familia)
    values (p_fecha, p_hora, left(trim(p_familia), 80)) returning token into v_token;
  exception when unique_violation then raise exception 'ocupado';
  end;
  return v_token;
end $$;

create or replace function public.agenda_cancelar(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin delete from public.agenda_reservas where token = p_token; return found; end $$;

create or replace function public.agenda_admin_lista(p_clave text)
returns table (id uuid, fecha date, hora smallint, familia text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.agenda_config c where c.clave = p_clave) then raise exception 'no_autorizado'; end if;
  return query select r.id, r.fecha, r.hora, r.familia, r.created_at from public.agenda_reservas r order by r.fecha, r.hora;
end $$;

create or replace function public.agenda_admin_borrar(p_clave text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.agenda_config c where c.clave = p_clave) then raise exception 'no_autorizado'; end if;
  delete from public.agenda_reservas where id = p_id; return found;
end $$;

revoke execute on function public.agenda_ocupados() from public;
revoke execute on function public.agenda_reservar(date,int,text) from public;
revoke execute on function public.agenda_cancelar(uuid) from public;
revoke execute on function public.agenda_admin_lista(text) from public;
revoke execute on function public.agenda_admin_borrar(text,uuid) from public;
grant execute on function public.agenda_ocupados() to anon, authenticated;
grant execute on function public.agenda_reservar(date,int,text) to anon, authenticated;
grant execute on function public.agenda_cancelar(uuid) to anon, authenticated;
grant execute on function public.agenda_admin_lista(text) to anon, authenticated;
grant execute on function public.agenda_admin_borrar(text,uuid) to anon, authenticated;
