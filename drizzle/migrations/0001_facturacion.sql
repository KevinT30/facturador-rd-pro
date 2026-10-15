create table public.facturas (
  id bigint generated always as identity primary key,
  fecha date not null default current_date,
  cliente_id bigint not null references public.clientes(id),
  vendedor_id bigint not null references public.vendedores(id),
  condicion_id bigint not null references public.condiciones_pago(id),
  comentario text not null default '' check (length(comentario) <= 500),
  dias integer not null default 0,
  fecha_vencimiento date,
  total numeric(14,2) not null default 0,
  comision_pct numeric(5,2) not null default 0,
  comision numeric(14,2) not null default 0,
  estado text not null default 'Emitida' check (estado in ('Emitida','Anulada')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.factura_detalle (
  id bigint generated always as identity primary key,
  factura_id bigint not null references public.facturas(id),
  articulo_id bigint not null references public.articulos(id),
  cantidad integer not null check (cantidad > 0),
  precio numeric(14,2) not null check (precio > 0),
  subtotal numeric(14,2) not null
);
create index on public.factura_detalle(factura_id);
create index on public.facturas(fecha);

grant select on public.facturas to authenticated;
grant select on public.factura_detalle to authenticated;
grant all on public.facturas to service_role;
grant all on public.factura_detalle to service_role;
alter table public.facturas enable row level security;
alter table public.factura_detalle enable row level security;
create policy "lectura autenticados" on public.facturas for select to authenticated using (true);
create policy "lectura autenticados" on public.factura_detalle for select to authenticated using (true);

create or replace view public.v_facturas with (security_invoker = true) as
select f.*, c.nombre as cliente, c.rnc_cedula, v.nombre as vendedor, cp.descripcion as condicion
from public.facturas f
join public.clientes c on c.id = f.cliente_id
join public.vendedores v on v.id = f.vendedor_id
join public.condiciones_pago cp on cp.id = f.condicion_id;

create or replace view public.v_factura_lineas with (security_invoker = true) as
select d.id, d.factura_id, d.articulo_id, a.descripcion as articulo, d.cantidad, d.precio, d.subtotal,
  f.fecha, f.estado, f.cliente_id, f.cliente, f.vendedor_id, f.vendedor, f.condicion_id, f.condicion
from public.factura_detalle d
join public.v_facturas f on f.id = d.factura_id
join public.articulos a on a.id = d.articulo_id;

grant select on public.v_facturas to authenticated;
grant select on public.v_factura_lineas to authenticated;

create or replace function public.crear_factura(
  p_fecha date, p_cliente bigint, p_vendedor bigint, p_condicion bigint, p_comentario text, p_lineas jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint; v_dias int; v_pct numeric; v_total numeric := 0; l jsonb; v_cant int; v_precio numeric;
begin
  if auth.uid() is null or not exists (select 1 from user_roles where user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_fecha is null then raise exception 'Fecha obligatoria'; end if;
  if not exists (select 1 from clientes where id = p_cliente and activo) then raise exception 'Cliente inválido o inactivo'; end if;
  select comision into v_pct from vendedores where id = p_vendedor and activo;
  if v_pct is null then raise exception 'Vendedor inválido o inactivo'; end if;
  select dias into v_dias from condiciones_pago where id = p_condicion and activo;
  if v_dias is null then raise exception 'Condición de pago inválida o inactiva'; end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'La factura debe tener al menos una línea';
  end if;
  if length(coalesce(p_comentario,'')) > 500 then raise exception 'Comentario demasiado largo'; end if;

  insert into facturas (fecha, cliente_id, vendedor_id, condicion_id, comentario, dias, fecha_vencimiento, comision_pct)
  values (p_fecha, p_cliente, p_vendedor, p_condicion, coalesce(p_comentario,''), v_dias,
          case when v_dias > 0 then p_fecha + v_dias else null end, v_pct)
  returning id into v_id;

  for l in select * from jsonb_array_elements(p_lineas) loop
    v_cant := (l->>'cantidad')::int;
    v_precio := round((l->>'precio')::numeric, 2);
    if not exists (select 1 from articulos where id = (l->>'articulo_id')::bigint and activo) then
      raise exception 'Artículo inválido o inactivo';
    end if;
    if v_cant is null or v_cant <= 0 then raise exception 'Cantidad inválida'; end if;
    if v_precio is null or v_precio <= 0 then raise exception 'Precio inválido'; end if;
    insert into factura_detalle (factura_id, articulo_id, cantidad, precio, subtotal)
    values (v_id, (l->>'articulo_id')::bigint, v_cant, v_precio, round(v_cant * v_precio, 2));
    v_total := v_total + round(v_cant * v_precio, 2);
  end loop;

  update facturas set total = v_total, comision = round(v_total * v_pct / 100, 2) where id = v_id;
  return v_id;
end; $$;

create or replace function public.anular_factura(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from user_roles where user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update facturas set estado = 'Anulada' where id = p_id and estado = 'Emitida';
  if not found then raise exception 'La factura no existe o ya está anulada'; end if;
end; $$;

revoke execute on function public.crear_factura(date,bigint,bigint,bigint,text,jsonb) from public, anon;
revoke execute on function public.anular_factura(bigint) from public, anon;
grant execute on function public.crear_factura(date,bigint,bigint,bigint,text,jsonb) to authenticated;
grant execute on function public.anular_factura(bigint) to authenticated;

-- Datos de ejemplo
insert into public.articulos (descripcion, precio_unitario) values
('Laptop Dell Latitude 5440', 58500.00),
('Monitor LG 24 pulgadas', 9850.00),
('Teclado y mouse inalámbrico', 2450.00),
('Impresora HP LaserJet', 18900.00),
('Resma de papel 8½x11', 395.00),
('Servicio de soporte técnico (hora)', 1800.00),
('Licencia Microsoft 365 (anual)', 6200.00),
('Disco SSD 1TB', 5750.00);

insert into public.clientes (nombre, rnc_cedula, cuenta_contable) values
('Distribuidora Caribe SRL', '131245678', '1101-001'),
('Ferretería Los Alcarrizos', '101987654', '1101-002'),
('Juan Pérez Martínez', '00112345678', '1101-003'),
('Colegio San Rafael', '130556677', '1101-004'),
('Clínica Santa Lucía SAS', '132009988', '1101-005');

insert into public.vendedores (nombre, comision) values
('María Rodríguez', 5), ('Carlos Gómez', 3.5), ('Ana Fernández', 4);

with nuevas as (
  insert into public.facturas (fecha, cliente_id, vendedor_id, condicion_id, dias, fecha_vencimiento, comision_pct)
  select x.fecha, x.c, x.v, x.cp, cp.dias, case when cp.dias > 0 then x.fecha + cp.dias end, v.comision
  from (values
    (current_date - 150, 1::bigint, 1::bigint, 1::bigint),
    (current_date - 120, 2, 2, 3),
    (current_date - 95, 3, 3, 1),
    (current_date - 70, 4, 1, 2),
    (current_date - 45, 5, 2, 3),
    (current_date - 20, 1, 3, 4),
    (current_date - 5, 2, 1, 1),
    (current_date - 1, 4, 2, 2)
  ) as x(fecha, c, v, cp)
  join public.condiciones_pago cp on cp.id = x.cp
  join public.vendedores v on v.id = x.v
  returning id
)
insert into public.factura_detalle (factura_id, articulo_id, cantidad, precio, subtotal)
select n.id, a.id, q.cant, a.precio_unitario, q.cant * a.precio_unitario
from nuevas n
cross join lateral (values (((n.id - 1) % 8) + 1, 1 + (n.id % 3)), (((n.id + 3) % 8) + 1, 2 + (n.id % 4))) as q(art, cant)
join public.articulos a on a.id = q.art;

update public.facturas f set total = s.t, comision = round(s.t * f.comision_pct / 100, 2)
from (select factura_id, sum(subtotal) t from public.factura_detalle group by factura_id) s
where s.factura_id = f.id;