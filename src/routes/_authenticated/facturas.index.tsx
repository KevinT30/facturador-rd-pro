import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatFecha, formatRD, padId } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnularButton } from "@/components/anular-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/facturas/")({
  head: () => ({
    meta: [
      { title: "Facturas · FacturaPro" },
      { name: "description", content: "Listado de facturas emitidas y anuladas." },
      { property: "og:title", content: "Facturas · FacturaPro" },
      { property: "og:description", content: "Listado de facturas emitidas y anuladas." },
    ],
  }),
  component: Facturas,
});

const PAGE = 10;

function Facturas() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data = [], isLoading } = useQuery({
    queryKey: ["facturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_facturas").select("*").order("id", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((f) =>
      [padId(f.id!), f.cliente, f.vendedor, f.condicion, f.estado, formatFecha(f.fecha)]
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }, [data, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Facturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta, imprime o anula facturas.</p>
        </div>
        <Button asChild>
          <Link to="/facturas/nueva">
            <Plus className="h-4 w-4" /> Nueva factura
          </Link>
        </Button>
      </div>
      <div className="rounded-xl border bg-card shadow-card">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por número, cliente, vendedor…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Cargando…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No hay facturas.</TableCell>
                </TableRow>
              ) : (
                filtered.slice(cur * PAGE, cur * PAGE + PAGE).map((f) => (
                  <TableRow key={f.id} className={f.estado === "Anulada" ? "opacity-60" : ""}>
                    <TableCell className="font-mono text-xs">{padId(f.id!)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatFecha(f.fecha)}</TableCell>
                    <TableCell>{f.cliente}</TableCell>
                    <TableCell>{f.vendedor}</TableCell>
                    <TableCell>{f.condicion}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatRD(Number(f.total))}</TableCell>
                    <TableCell>
                      <Badge variant={f.estado === "Anulada" ? "destructive" : "default"}>{f.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/facturas/$id" params={{ id: String(f.id) }}>
                            <Eye className="h-4 w-4" /> Ver
                          </Link>
                        </Button>
                        {f.estado !== "Anulada" && <AnularButton id={f.id!} compact />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>{filtered.length} factura(s)</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Página {cur + 1} de {pages}</span>
            <Button variant="outline" size="icon" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
