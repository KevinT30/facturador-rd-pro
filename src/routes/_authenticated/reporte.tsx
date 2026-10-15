import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileBarChart, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { catalogosQuery } from "@/lib/catalogos";
import { downloadCSV, formatFecha, formatRD, padId, todayISO } from "@/lib/format";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/reporte")({
  head: () => ({
    meta: [
      { title: "Reporte por cliente · FacturaPro" },
      { name: "description", content: "Reporte de facturación por cliente entre fechas, imprimible y exportable a CSV." },
      { property: "og:title", content: "Reporte por cliente · FacturaPro" },
      { property: "og:description", content: "Reporte de facturación por cliente entre fechas, imprimible y exportable a CSV." },
    ],
  }),
  component: Reporte,
});

type Fila = { id: number; fecha: string; condicion: string; vendedor: string; total: number };
type Grupo = { cliente: string; rnc: string; facturas: Fila[]; subtotal: number };

function Reporte() {
  const { data: cat } = useQuery(catalogosQuery(false));
  const hoy = todayISO();
  const [cliente, setCliente] = useState("todos");
  const [desde, setDesde] = useState(hoy.slice(0, 8) + "01");
  const [hasta, setHasta] = useState(hoy);

  const gen = useMutation({
    mutationFn: async () => {
      if (!desde || !hasta) throw new Error("Indica fecha desde y hasta");
      if (desde > hasta) throw new Error("La fecha desde no puede ser mayor que la fecha hasta");
      let q = supabase.from("v_facturas").select("*").eq("estado", "Emitida").gte("fecha", desde).lte("fecha", hasta);
      if (cliente !== "todos") q = q.eq("cliente_id", Number(cliente));
      const { data, error } = await q.order("cliente").order("fecha").order("id");
      if (error) throw error;
      const map = new Map<number, Grupo>();
      for (const f of data) {
        const g = map.get(f.cliente_id!) ?? { cliente: f.cliente!, rnc: f.rnc_cedula!, facturas: [], subtotal: 0 };
        g.facturas.push({ id: f.id!, fecha: f.fecha!, condicion: f.condicion!, vendedor: f.vendedor!, total: Number(f.total) });
        g.subtotal += Number(f.total);
        map.set(f.cliente_id!, g);
      }
      const grupos = [...map.values()];
      return { grupos, total: grupos.reduce((s, g) => s + g.subtotal, 0), desde, hasta };
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const r = gen.data;

  const exportar = () => {
    if (!r) return;
    const rows: (string | number)[][] = [["Cliente", "RNC/Cédula", "Factura", "Fecha", "Condición", "Vendedor", "Total"]];
    r.grupos.forEach((g) => {
      g.facturas.forEach((f) => rows.push([g.cliente, g.rnc, padId(f.id), formatFecha(f.fecha), f.condicion, f.vendedor, f.total.toFixed(2)]));
      rows.push([g.cliente, "", "", "", "", "Subtotal cliente", g.subtotal.toFixed(2)]);
    });
    rows.push(["", "", "", "", "", "Gran total", r.total.toFixed(2)]);
    downloadCSV(`reporte-facturacion_${r.desde}_${r.hasta}.csv`, rows);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reporte de facturación por cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">Facturas emitidas agrupadas por cliente entre dos fechas.</p>
      </div>
      <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end print:hidden">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Combobox
            value={cliente}
            onChange={setCliente}
            options={[
              { value: "todos", label: "Todos los clientes" },
              ...(cat?.clientes ?? []).map((c) => ({ value: String(c.id), label: c.nombre, hint: c.rnc_cedula })),
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
          <FileBarChart className="h-4 w-4" /> {gen.isPending ? "Generando…" : "Generar"}
        </Button>
      </section>

      {r && (
        <article className="rounded-xl border bg-card p-6 shadow-card print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-lg font-bold">FacturaPro · Facturación por cliente</p>
              <p className="text-sm text-muted-foreground">
                Del {formatFecha(r.desde)} al {formatFecha(r.hasta)}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={exportar} disabled={!r.grupos.length}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
              <Button onClick={() => window.print()} disabled={!r.grupos.length}>
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </Button>
            </div>
          </div>
          {r.grupos.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No hay facturas en ese período.</p>
          ) : (
            <div className="space-y-6 pt-4">
              {r.grupos.map((g) => (
                <section key={g.cliente + g.rnc} className="break-inside-avoid">
                  <h3 className="font-semibold">
                    {g.cliente} <span className="text-sm font-normal text-muted-foreground">· {g.rnc}</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="mt-2 w-full text-sm">
                      <thead>
                        <tr className="border-y bg-muted/60 text-left">
                          <th className="p-2">Factura</th>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Condición</th>
                          <th className="p-2">Vendedor</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.facturas.map((f) => (
                          <tr key={f.id} className="border-b">
                            <td className="p-2 font-mono text-xs">{padId(f.id)}</td>
                            <td className="p-2">{formatFecha(f.fecha)}</td>
                            <td className="p-2">{f.condicion}</td>
                            <td className="p-2">{f.vendedor}</td>
                            <td className="whitespace-nowrap p-2 text-right tabular-nums">{formatRD(f.total)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-medium">Subtotal cliente</td>
                          <td className="whitespace-nowrap p-2 text-right font-semibold tabular-nums">{formatRD(g.subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
              <div className="flex justify-between rounded-lg bg-accent p-4 text-lg font-bold text-accent-foreground">
                <span>Gran total</span>
                <span className="tabular-nums">{formatRD(r.total)}</span>
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
