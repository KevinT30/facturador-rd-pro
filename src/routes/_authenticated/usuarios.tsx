import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserQuery, useCurrentUser, type AppRole } from "@/lib/current-user";
import { formatFecha } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios · FacturaPro" },
      { name: "description", content: "Gestión de usuarios y roles de FacturaPro." },
      { property: "og:title", content: "Usuarios · FacturaPro" },
      { property: "og:description", content: "Gestión de usuarios y roles de FacturaPro." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const u = await context.queryClient.ensureQueryData(currentUserQuery);
    if (u?.role !== "admin") throw redirect({ to: "/panel" });
  },
  component: Usuarios,
});

function Usuarios() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        role: (roles?.find((r) => r.user_id === p.id)?.role ?? "facturador") as AppRole,
      }));
    },
  });

  const change = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Asigna el rol de cada usuario. Los nuevos usuarios se registran como facturadores.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Registrado</TableHead>
              <TableHead className="w-48">Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{formatFecha(u.created_at)}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    disabled={u.id === me?.id}
                    onValueChange={(v) => change.mutate({ id: u.id, role: v as AppRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="facturador">Facturador</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
