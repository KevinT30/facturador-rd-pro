import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { catalogosQuery } from "@/lib/catalogos";
import { addDaysISO, formatFecha, formatRD, todayISO } from "@/lib/format";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/facturas/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva factura · FacturaPro" },
      { name: "description", content: "Crea una nueva factura con artículos, cliente y vendedor." },
      { property: "og:title", content: "Nueva factura · FacturaPro" },
      { property: "og:description", content: "Crea una nueva factura con artículos, cliente y vendedor." },
    ],
  }),
  component: NuevaFactura,
});

type Linea = { key: number; articulo_id: string; cantidad: string; precio: string };
let k = 1;
const nuevaLinea = (): Linea => ({ key: k++, articulo_id: "", cantidad: "1", precio: "" });

function NuevaFactura() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: cat, isLoading } = useQuery(catalogosQuery(true));
  const { data: nextId } = useQuery({
    queryKey: ["next-factura-id"],
    queryFn: async () => {
      const { data } = await supabase.from("facturas").select("id").order("id", { ascending: false }).limit(1);
      return (data?.[0]?.id ?? 0) + 1;
    },
  });

  const [fecha, setFecha] = useState(todayISO());
  const [cliente, setCliente] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [condicion, setCondicion] = useState("");
  const [comentario, setComentario] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [errors, setErrors] = useState<Partial<Record<string, string>> & { fecha?: string; cliente?: string; vendedor?: string; condicion?: string; comentario?: string; lineas?: string }>({});

  const vend = cat?.vendedores.find((v) => String(v.id) === vendedor);
  const cond = cat?.condiciones.find((c) => String(c.id) === condicion);
  const total = useMemo(
    () =>
      lineas.reduce((s, l) => {
        const q = parseInt(l.cantidad, 10);
        const p = parseFloat(l.precio);
        return s + (q > 0 && p > 0 ? Math.round(q * p * 100) / 100 : 0);
      }, 0),
    [lineas],
  );
  const comision = vend ? Math.round(total * Number(vend.comision)) / 100 : 0;

  const upd = (key: number, patch: Partial<Linea>) =>
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("crear_factura", {
        p_fecha: fecha,
        p_cliente: Number(cliente),
        p_vendedor: Number(vendedor),
        p_condicion: Number(condicion),
        p_comentario: comentario.trim(),
        p_lineas: lineas.map((l) => ({
          articulo_id: Number(l.articulo_id),
          cantidad: parseInt(l.cantidad, 10),
          precio: parseFloat(l.precio),
        })),
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (id) => {
      toast.success(`Factura #${id} guardada`);
      qc.invalidateQueries();
      navigate({ to: "/facturas/$id", params: { id: String(id) } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    const e: Partial<Record<string, string>> & { fecha?: string; cliente?: string; vendedor?: string; condicion?: string; comentario?: string; lineas?: string } = {};
    if (!fecha) e.fecha = "Fecha obligatoria";
    if (!cliente) e.cliente = "Selecciona un cliente";
    if (!vendedor) e.vendedor = "Selecciona un vendedor";
    if (!condicion) e.condicion = "Selecciona una condición de pago";
    if (comentario.length > 500) e.comentario = "Máximo 500 caracteres";
    if (lineas.length === 0) e.lineas = "Agrega al menos una línea";
    lineas.forEach((l) => {
      if (!l.articulo_id) e[`a${l.key}`] = "Elige un artículo";
      if (!/^\d+$/.test(l.cantidad) || parseInt(l.cantidad, 10) <= 0) e[`q${l.key}`] = "Entero > 0";
      if (!(parseFloat(l.precio) > 0)) e[`p${l.key}`] = "Precio > 0";
    });
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Revisa los campos marcados");
      return;
    }
    save.mutate();
  };

  if (isLoading || !cat) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nueva factura</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Factura #{nextId ? String(nextId).padStart(4, "0") : "…"} (se asigna al guardar)
          </p>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-card md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {fecha && <p className="text-xs text-muted-foreground">{formatFecha(fecha)}</p>}
          {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
        </div>
        <div className="space-y-1.5 lg:col-span-3">
          <Label htmlFor="cliente">Cliente</Label>
          <Combobox
            id="cliente"
            value={cliente}
            onChange={setCliente}
            invalid={!!errors.cliente}
            placeholder="Buscar cliente…"
            options={cat.clientes.map((c) => ({ value: String(c.id), label: c.nombre, hint: c.rnc_cedula }))}
          />
          {errors.cliente && <p className="text-xs text-destructive">{errors.cliente}</p>}
        </div>
        <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
          <Label htmlFor="vendedor">Vendedor</Label>
          <Combobox
            id="vendedor"
            value={vendedor}
            onChange={setVendedor}
            invalid={!!errors.vendedor}
            options={cat.vendedores.map((v) => ({ value: String(v.id), label: v.nombre, hint: `${Number(v.comision)}%` }))}
          />
          {errors.vendedor && <p className="text-xs text-destructive">{errors.vendedor}</p>}
        </div>
        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="condicion">Condición de pago</Label>
          <Combobox
            id="condicion"
            value={condicion}
            onChange={setCondicion}
            invalid={!!errors.condicion}
            options={cat.condiciones.map((c) => ({
              value: String(c.id),
              label: c.descripcion,
              hint: c.dias > 0 ? `${c.dias} días` : "Contado",
            }))}
          />
          {cond && cond.dias > 0 && fecha && (
            <p className="text-xs font-medium text-primary">Vence el {formatFecha(addDaysISO(fecha, cond.dias))}</p>
          )}
          {errors.condicion && <p className="text-xs text-destructive">{errors.condicion}</p>}
        </div>
        <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea id="comentario" rows={2} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Detalle</h2>
          <Button variant="outline" size="sm" onClick={() => setLineas((l) => [...l, nuevaLinea()])}>
            <Plus className="h-4 w-4" /> Agregar línea
          </Button>
        </div>
        {lineas.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {errors.lineas ?? "No hay líneas. Agrega al menos una."}
          </p>
        )}
        <div className="divide-y">
          {lineas.map((l, i) => {
            const q = parseInt(l.cantidad, 10);
            const p = parseFloat(l.precio);
            const sub = q > 0 && p > 0 ? q * p : 0;
            return (
              <div key={l.key} className="grid items-start gap-3 p-4 md:grid-cols-[2rem_1fr_7rem_9rem_9rem_2.5rem]">
                <span className="pt-2 text-sm text-muted-foreground">{i + 1}</span>
                <div>
                  <Combobox
                    value={l.articulo_id}
                    invalid={!!errors[`a${l.key}`]}
                    placeholder="Buscar artículo…"
                    onChange={(v) => {
                      const a = cat.articulos.find((x) => String(x.id) === v);
                      upd(l.key, { articulo_id: v, precio: a ? String(a.precio_unitario) : l.precio });
                    }}
                    options={cat.articulos.map((a) => ({
                      value: String(a.id),
                      label: a.descripcion,
                      hint: formatRD(Number(a.precio_unitario)),
                    }))}
                  />
                  {errors[`a${l.key}`] && <p className="mt-1 text-xs text-destructive">{errors[`a${l.key}`]}</p>}
                </div>
                <div>
                  <Input
                    aria-label="Cantidad"
                    type="number"
                    min={1}
                    step={1}
                    value={l.cantidad}
                    aria-invalid={!!errors[`q${l.key}`]}
                    onChange={(e) => upd(l.key, { cantidad: e.target.value })}
                  />
                  {errors[`q${l.key}`] && <p className="mt-1 text-xs text-destructive">{errors[`q${l.key}`]}</p>}
                </div>
                <div>
                  <Input
                    aria-label="Precio unitario"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={l.precio}
                    aria-invalid={!!errors[`p${l.key}`]}
                    onChange={(e) => upd(l.key, { precio: e.target.value })}
                  />
                  {errors[`p${l.key}`] && <p className="mt-1 text-xs text-destructive">{errors[`p${l.key}`]}</p>}
                </div>
                <p className="pt-2 text-right font-medium tabular-nums">{formatRD(sub)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar línea"
                  onClick={() => setLineas((ls) => ls.filter((x) => x.key !== l.key))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="flex gap-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total factura</p>
            <p className="text-2xl font-bold tabular-nums">{formatRD(total)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Comisión vendedor {vend ? `(${Number(vend.comision)}%)` : ""}
            </p>
            <p className="text-2xl font-bold tabular-nums text-primary">{formatRD(comision)}</p>
          </div>
        </div>
        <Button size="lg" onClick={submit} disabled={save.isPending}>
          <Save className="h-4 w-4" /> {save.isPending ? "Guardando…" : "Guardar factura"}
        </Button>
      </section>
    </div>
  );
}
