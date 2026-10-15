create type public.app_role as enum ('admin', 'facturador');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role app_role not null
);
grant select, update on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "roles read own or admin" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "roles admin update" on public.user_roles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), coalesce(new.email,''));
  perform pg_advisory_xact_lock(424242);
  insert into public.user_roles (user_id, role)
  values (new.id, case when exists (select 1 from public.user_roles where role='admin') then 'facturador'::app_role else 'admin'::app_role end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Catálogos
create table public.articulos (
  id bigint generated always as identity primary key,
  descripcion text not null check (length(trim(descripcion)) between 1 and 200),
  precio_unitario numeric(14,2) not null check (precio_unitario > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.clientes (
  id bigint generated always as identity primary key,
  nombre text not null check (length(trim(nombre)) between 1 and 200),
  rnc_cedula text not null unique check (rnc_cedula ~ '^([0-9]{9}|[0-9]{11})$'),
  cuenta_contable text not null default '' check (length(cuenta_contable) <= 50),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.condiciones_pago (
  id bigint generated always as identity primary key,
  descripcion text not null check (length(trim(descripcion)) between 1 and 100),
  dias integer not null default 0 check (dias >= 0 and dias <= 3650),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.vendedores (
  id bigint generated always as identity primary key,
  nombre text not null check (length(trim(nombre)) between 1 and 150),
  comision numeric(5,2) not null default 0 check (comision >= 0 and comision <= 100),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['articulos','clientes','condiciones_pago','vendedores'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "lectura autenticados" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "admin inserta" on public.%I for insert to authenticated with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin actualiza" on public.%I for update to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

insert into public.condiciones_pago (descripcion, dias) values
('Al contado',0),('A crédito 15 días',15),('A crédito 30 días',30),('Cheque',0);