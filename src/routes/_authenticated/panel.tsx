import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Banknote, FileText, Users, Package, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/current-user";
import { formatFecha, formatRD, MESES, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Inicio · FacturaPro" },
      { name: "description", content: "Resumen de facturación: totales del mes, gráfica mensual y artículos más vendidos." },
      { property: "og:title", content: "Inicio · FacturaPro" },
      { property: "og:description", content: "Resumen de facturación: totales del mes, gráfica mensual y artículos más vendidos." },
    ],
  }),
  component: Panel,
});

const chartConfig = { total: { label: "Facturado", color: "var(--chart-1)" } } satisfies ChartConfig;

function Panel() {
  const user = useCurrentUser();
  const hoy = todayISO();
  const mesActual = hoy.slice(0, 7);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const d = new Date();
      const inicio = `${new Date(d.getFullYear(), d.getMonth() - 11, 1).toISOString().slice(0, 7)}-01`;
      const [f, l, c, a] = await Promise.all([
        supabase.from("facturas").select("fecha,total").eq("estado", "Emitida").gte("fecha", inicio),
        supabase.from("v_factura_lineas").select("articulo,cantidad,subtotal").eq("estado", "Emitida").limit(5000),
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase.from("articulos").select("id", { count: "exact", head: true }).eq("activo", true),
      ]);
      const meses: { key: string; mes: string; total: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
        meses.push({ key, mes: `${MESES[x.getMonth()]} ${String(x.getFullYear()).slice(2)}`, total: 0 });
      }
      for (const r of f.data ?? []) {
        const m = meses.find((x) => x.key === r.fecha.slice(0, 7));
        if (m) m.total += Number(r.total);
      }
      const top = new Map<string, { articulo: string; cantidad: number; total: number }>();
      for (const r of l.data ?? []) {
        const t = top.get(r.articulo!) ?? { articulo: r.articulo!, cantidad: 0, total: 0 };
        t.cantidad += Number(r.cantidad);
        t.total += Number(r.subtotal);
        top.set(r.articulo!, t);
      }
      const delMes = (f.data ?? []).filter((r) => r.fecha.startsWith(mesActual));
      return {
        meses,
        top: [...top.values()].sort((x, y) => y.cantidad - x.cantidad).slice(0, 5),
        totalMes: delMes.reduce((s, r) => s + Number(r.total), 0),
        facturasMes: delMes.length,
        clientes: c.count ?? 0,
        articulos: a.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Facturado este mes", value: data ? formatRD(data.totalMes) : "–", icon: Banknote },
    { label: "Facturas este mes", value: data?.facturasMes ?? "–", icon: FileText },
    { label: "Clientes activos", value: data?.clientes ?? "–", icon: Users },
    { label: "Artículos activos", value: data?.articulos ?? "–", icon: Package },
  ];
  const maxTop = Math.max(1, ...(data?.top.map((t) => t.cantidad) ?? [1]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-brand p-6 text-primary-foreground shadow-card md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm opacity-80">{formatFecha(hoy)}</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Hola, {user?.nombre ?? ""}</h1>
          <p className="mt-1 text-sm opacity-90">Este es el resumen de tu facturación.</p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/facturas/nueva">
            <Plus className="h-4 w-4" /> Nueva factura
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 truncate text-2xl font-bold tabular-nums">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-3">
          <h2 className="font-semibold">Facturación por mes</h2>
          <p className="mb-4 text-xs text-muted-foreground">Últimos 12 meses (sin anuladas)</p>
          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Cargando…</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={data?.meses ?? []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatRD(Number(v))} />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="font-semibold">Top 5 artículos más vendidos</h2>
          <p className="mb-4 text-xs text-muted-foreground">Por unidades</p>
          {!data?.top.length ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{isLoading ? "Cargando…" : "Aún no hay ventas."}</p>
          ) : (
            <ol className="space-y-4">
              {data.top.map((t, i) => (
                <li key={t.articulo}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium">
                      {i + 1}. {t.articulo}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{t.cantidad} uds.</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(t.cantidad / maxTop) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatRD(t.total)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
