import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatFecha, formatRD, padId } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnularButton } from "@/components/anular-button";

export const Route = createFileRoute("/_authenticated/facturas/$id")({
  head: () => ({
    meta: [
      { title: "Factura · FacturaPro" },
      { name: "description", content: "Vista de impresión de la factura." },
      { property: "og:title", content: "Factura · FacturaPro" },
      { property: "og:description", content: "Vista de impresión de la factura." },
    ],
  }),
  component: VerFactura,
});

function VerFactura() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["factura", id],
    queryFn: async () => {
      const [f, l] = await Promise.all([
        supabase.from("v_facturas").select("*").eq("id", Number(id)).maybeSingle(),
        supabase.from("v_factura_lineas").select("*").eq("factura_id", Number(id)).order("id"),
      ]);
      if (f.error) throw f.error;
      return { f: f.data, lineas: l.data ?? [] };
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando…</p>;
  const f = data?.f;
  if (!f) return <p className="text-muted-foreground">La factura no existe.</p>;
  const anulada = f.estado === "Anulada";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/facturas">
            <ArrowLeft className="h-4 w-4" /> Facturas
          </Link>
        </Button>
        <div className="flex gap-2">
          {!anulada && <AnularButton id={f.id!} />}
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      <article className="relative rounded-xl border bg-card p-6 shadow-card md:p-10 print:border-0 print:p-0 print:shadow-none">
        {anulada && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-destructive px-6 py-2 text-5xl font-extrabold tracking-widest text-destructive opacity-30">
              ANULADA
            </span>
          </div>
        )}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">FacturaPro</p>
              <p className="text-xs text-muted-foreground">República Dominicana</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Factura</p>
            <p className="text-2xl font-bold">#{padId(f.id!)}</p>
            <Badge variant={anulada ? "destructive" : "default"} className="mt-1">
              {f.estado}
            </Badge>
          </div>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
            <p className="font-semibold">{f.cliente}</p>
            <p className="text-sm text-muted-foreground">RNC/Cédula: {f.rnc_cedula}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Fecha</dt>
            <dd className="text-right font-medium">{formatFecha(f.fecha)}</dd>
            <dt className="text-muted-foreground">Condición</dt>
            <dd className="text-right font-medium">{f.condicion}</dd>
            {f.fecha_vencimiento && (
              <>
                <dt className="text-muted-foreground">Vencimiento</dt>
                <dd className="text-right font-medium">{formatFecha(f.fecha_vencimiento)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Vendedor</dt>
            <dd className="text-right font-medium">{f.vendedor}</dd>
          </dl>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-muted/60 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Artículo</th>
              <th className="p-2 text-right">Cant.</th>
              <th className="p-2 text-right">Precio</th>
              <th className="p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.lineas.map((l, i) => (
              <tr key={l.id} className="border-b">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2">{l.articulo}</td>
                <td className="p-2 text-right tabular-nums">{l.cantidad}</td>
                <td className="p-2 text-right tabular-nums">{formatRD(Number(l.precio))}</td>
                <td className="p-2 text-right tabular-nums">{formatRD(Number(l.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatRD(Number(f.total))}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground print:hidden">
              <dt>Comisión vendedor ({Number(f.comision_pct)}%)</dt>
              <dd className="tabular-nums">{formatRD(Number(f.comision))}</dd>
            </div>
          </dl>
        </div>

        {f.comentario && (
          <p className="mt-6 rounded-md bg-muted p-3 text-sm">
            <span className="font-medium">Comentario: </span>
            {f.comentario}
          </p>
        )}
      </article>
    </div>
  );
}
