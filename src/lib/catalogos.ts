import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Catalog rows for selectors. `soloActivos` restricts to active records (for new invoices). */
export const catalogosQuery = (soloActivos: boolean) =>
  queryOptions({
    queryKey: ["catalogos", soloActivos],
    queryFn: async () => {
      let c = supabase.from("clientes").select("id,nombre,rnc_cedula");
      let v = supabase.from("vendedores").select("id,nombre,comision");
      let cp = supabase.from("condiciones_pago").select("id,descripcion,dias");
      let a = supabase.from("articulos").select("id,descripcion,precio_unitario");
      if (soloActivos) {
        c = c.eq("activo", true);
        v = v.eq("activo", true);
        cp = cp.eq("activo", true);
        a = a.eq("activo", true);
      }
      const [rc, rv, rcp, ra] = await Promise.all([
        c.order("nombre"),
        v.order("nombre"),
        cp.order("id"),
        a.order("descripcion"),
      ]);
      const err = rc.error || rv.error || rcp.error || ra.error;
      if (err) throw err;
      return {
        clientes: rc.data ?? [],
        vendedores: rv.data ?? [],
        condiciones: rcp.data ?? [],
        articulos: ra.data ?? [],
      };
    },
  });
