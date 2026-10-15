import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eraser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogosQuery } from "@/lib/catalogos";
import { formatFecha, formatRD, padId } from "@/lib/format";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/consulta")({
  head: () => ({
    meta: [
      { title: "Consulta de facturación · FacturaPro" },
      { name: "description", content: "Consulta lo facturado por artículo, vendedor, cliente, condición y fecha." },
      { property: "og:title", content: "Consulta de facturación · FacturaPro" },
      { property: "og:description", content: "Consulta lo facturado por artículo, vendedor, cliente, condición y fecha." },
    ],
  }),
  component: Consulta,
});

const vacio = { articulo: "", vendedor: "", cliente: "", condicion: "", desde: "", hasta: "" };

function Consulta() {
  const { data: cat } = useQuery(catalogosQuery(false));
  const [f, setF] = useState(vacio);
  const set = (k: keyof typeof vacio) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const { data = [], isFetching } = useQuery({
    queryKey: ["consulta", f],
    queryFn: async () => {
      let q = supabase.from("v_factura_lineas").select("*").eq("estado", "Emitida");
      if (f.articulo) q = q.eq("articulo_id", Number(f.articulo));
      if (f.vendedor) q = q.eq("vendedor_id", Number(f.vendedor));
      if (f.cliente) q = q.eq("cliente_id", Number(f.cliente));
      if (f.condicion) q = q.eq("condicion_id", Number(f.condicion));
      if (f.desde) q = q.gte("fecha", f.desde);
      if (f.hasta) q = q.lte("fecha", f.hasta);
      const { data, error } = await q.order("fecha", { ascending: false }).order("factura_id", { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
  const total = data.reduce((s, r) => s + Number(r.subtotal), 0);
  const cantidad = data.reduce((s, r) => s + Number(r.cantidad), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Consulta de facturación</h1>
        <p className="mt-1 text-sm text-muted-foreground">Combina filtros para ver lo facturado (sin facturas anuladas).</p>
      </div>
      <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Artículo</Label>
          <Combobox value={f.articulo} onChange={set("articulo")} placeholder="Todos" options={(cat?.articulos ?? []).map((a) => ({ value: String(a.id), label: a.descripcion }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Vendedor</Label>
          <Combobox value={f.vendedor} onChange={set("vendedor")} placeholder="Todos" options={(cat?.vendedores ?? []).map((a) => ({ value: String(a.id), label: a.nombre }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Combobox value={f.cliente} onChange={set("cliente")} placeholder="Todos" options={(cat?.clientes ?? []).map((a) => ({ value: String(a.id), label: a.nombre, hint: a.rnc_cedula }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Condición de pago</Label>
          <Combobox value={f.condicion} onChange={set("condicion")} placeholder="Todas" options={(cat?.condiciones ?? []).map((a) => ({ value: String(a.id), label: a.descripcion }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" value={f.desde} onChange={(e) => set("desde")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" value={f.hasta} onChange={(e) => set("hasta")(e.target.value)} />
        </div>
        <div className="flex items-center justify-between sm:col-span-2 lg:col-span-3">
          <p className="text-sm text-muted-foreground">
            {isFetching ? "Buscando…" : `${data.length} línea(s) · ${cantidad} unidad(es)`}
          </p>
          <Button variant="outline" onClick={() => setF(vacio)}>
            <Eraser className="h-4 w-4" /> Limpiar filtros
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {isFetching ? "Cargando…" : "No hay resultados para estos filtros."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to="/facturas/$id" params={{ id: String(r.factura_id) }} className="font-mono text-xs text-primary hover:underline">
                      {padId(r.factura_id!)}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatFecha(r.fecha)}</TableCell>
                  <TableCell>{r.cliente}</TableCell>
                  <TableCell>{r.vendedor}</TableCell>
                  <TableCell>{r.articulo}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.cantidad}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatRD(Number(r.precio))}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatRD(Number(r.subtotal))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-semibold">Total acumulado</TableCell>
                <TableCell className="whitespace-nowrap text-right font-bold tabular-nums">{formatRD(total)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
