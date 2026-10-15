import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Users, CreditCard, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/current-user";
import { formatFecha } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel · FacturaPro" },
      { name: "description", content: "Resumen general del sistema de facturación FacturaPro." },
      { property: "og:title", content: "Panel · FacturaPro" },
      { property: "og:description", content: "Resumen general del sistema de facturación FacturaPro." },
    ],
  }),
  component: Panel,
});

const cards = [
  { table: "articulos", label: "Artículos", url: "/articulos", icon: Package },
  { table: "clientes", label: "Clientes", url: "/clientes", icon: Users },
  { table: "condiciones_pago", label: "Condiciones de pago", url: "/condiciones", icon: CreditCard },
  { table: "vendedores", label: "Vendedores", url: "/vendedores", icon: BadgeCheck },
] as const;

function Panel() {
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["panel-counts"],
    queryFn: async () =>
      Promise.all(
        cards.map(async (c) => {
          const { count } = await supabase
            .from(c.table)
            .select("id", { count: "exact", head: true })
            .eq("activo", true);
          return count ?? 0;
        }),
      ),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-2xl bg-brand p-6 text-primary-foreground shadow-card md:p-8">
        <p className="text-sm opacity-80">{formatFecha(new Date())}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Hola, {user?.nombre ?? ""}</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          Bienvenido a FacturaPro. Administra tus catálogos y prepara todo para facturar.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Link
            key={c.url}
            to={c.url}
            className="group rounded-xl border bg-card p-5 shadow-card transition-colors hover:border-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-bold">{data ? data[i] : "–"}</p>
            <p className="text-sm text-muted-foreground">{c.label} activos</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
