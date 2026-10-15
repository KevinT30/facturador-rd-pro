import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Catalog rows for selectors. `soloActivos` restricts to active records (for new invoices). */
export const catalogosQuery = (soloActivos: boolean) =>
  queryOptions({
    queryKey: ["catalogos", soloActivos],
    queryFn: async () => {
      const f = <T,>(q: { eq: (c: string, v: boolean) => T } & T) => (soloActivos ? q.eq("activo", true) : q);
      const [c, v, cp, a] = await Promise.all([
        f(supabase.from("clientes").select("id,nombre,rnc_cedula").order("nombre")),
        f(supabase.from("vendedores").select("id,nombre,comision").order("nombre")),
        f(supabase.from("condiciones_pago").select("id,descripcion,dias").order("id")),
        f(supabase.from("articulos").select("id,descripcion,precio_unitario").order("descripcion")),
      ]);
      const err = c.error || v.error || cp.error || a.error;
      if (err) throw err;
      return { clientes: c.data!, vendedores: v.data!, condiciones: cp.data!, articulos: a.data! };
    },
  });
