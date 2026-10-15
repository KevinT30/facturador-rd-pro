import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/current-user";
import { padId } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number";
  placeholder?: string;
  step?: string;
  inputMode?: "numeric" | "decimal" | "text";
};
export type Column = { key: string; label: string; render?: (row: Row) => ReactNode; className?: string };
export type Row = Record<string, unknown> & { id: number; activo: boolean };

type Props = {
  table: "articulos" | "clientes" | "condiciones_pago" | "vendedores";
  title: string;
  singular: string;
  description: string;
  fields: Field[];
  columns: Column[];
  schema: ZodType<Record<string, unknown>>;
  searchKeys: string[];
  defaults: Record<string, string>;
};

const PAGE = 10;
// Dynamic table access; each page passes a typed table name.
const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from<"articulos">>;
};

export function CrudPage(p: Props) {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"todos" | "activos" | "inactivos">("todos");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(p.defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [p.table],
    queryFn: async () => {
      const { data, error } = await db.from(p.table).select("*").order("id");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (estado === "activos" && !r.activo) return false;
      if (estado === "inactivos" && r.activo) return false;
      if (!s) return true;
      return (
        padId(r.id).includes(s) ||
        p.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s))
      );
    });
  }, [rows, q, estado, p.searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const visible = filtered.slice(cur * PAGE, cur * PAGE + PAGE);

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const res = editing
        ? await db.from(p.table).update(values as never).eq("id", editing.id)
        : await db.from(p.table).insert(values as never);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? `${p.singular} actualizado` : `${p.singular} creado`);
      setOpen(false);
      qc.invalidateQueries({ queryKey: [p.table] });
    },
    onError: (e: { code?: string; message: string }) => {
      if (e.code === "23505") setErrors({ rnc_cedula: "Este RNC/Cédula ya está registrado" });
      else toast.error("No se pudo guardar: " + e.message);
    },
  });

  const toggle = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await db.from(p.table).update({ activo: !r.activo } as never).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [p.table] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(p.defaults);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm(Object.fromEntries(p.fields.map((f) => [f.key, String(r[f.key] ?? "")])));
    setErrors({});
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = p.schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = String(i.path[0]);
        if (!errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Nuevo {p.singular.toLowerCase()}
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar…"
              className="pl-9"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="flex rounded-md border p-0.5">
            {(["todos", "activos", "inactivos"] as const).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setEstado(k);
                  setPage(0);
                }}
                className={`rounded px-3 py-1.5 text-sm capitalize transition-colors ${
                  estado === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                {p.columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="w-28">Estado</TableHead>
                {isAdmin && <TableHead className="w-32 text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={p.columns.length + 3} className="py-10 text-center text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={p.columns.length + 3} className="py-10 text-center text-muted-foreground">
                    No hay registros.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id} className={r.activo ? "" : "opacity-60"}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{padId(r.id)}</TableCell>
                    {p.columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>
                        {c.render ? c.render(r) : String(r[c.key] ?? "")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={r.activo ? "default" : "secondary"}>
                        {r.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={r.activo}
                            onCheckedChange={() => toggle.mutate(r)}
                            aria-label="Cambiar estado"
                          />
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            {filtered.length} registro{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Página {cur + 1} de {pages}
            </span>
            <Button variant="outline" size="icon" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar ${p.singular.toLowerCase()} #${padId(editing.id)}` : `Nuevo ${p.singular.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {p.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  step={f.step}
                  inputMode={f.inputMode}
                  placeholder={f.placeholder}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  aria-invalid={!!errors[f.key]}
                />
                {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
