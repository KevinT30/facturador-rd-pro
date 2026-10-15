import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · FacturaPro" },
      { name: "description", content: "Accede a FacturaPro, tu sistema de facturación en RD$." },
      { property: "og:title", content: "Iniciar sesión · FacturaPro" },
      { property: "og:description", content: "Accede a FacturaPro, tu sistema de facturación en RD$." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});
const signupSchema = loginSchema.extend({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
});

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const p = loginSchema.safeParse(f);
    if (!p.success) {
      toast.error(p.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(p.data);
    setLoading(false);
    if (error) {
      toast.error("Correo o contraseña incorrectos");
      return;
    }
    qc.removeQueries({ queryKey: ["current-user"] });
    navigate({ to: "/panel" });
  };

  const signup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const p = signupSchema.safeParse(f);
    if (!p.success) {
      toast.error(p.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: p.data.email,
      password: p.data.password,
      options: { emailRedirectTo: window.location.origin, data: { nombre: p.data.nombre } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      qc.removeQueries({ queryKey: ["current-user"] });
      navigate({ to: "/panel" });
    } else setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-card">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">FacturaPro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistema de Facturación · República Dominicana</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          {sent ? (
            <div className="space-y-2 text-center">
              <h2 className="text-lg font-semibold">Revisa tu correo</h2>
              <p className="text-sm text-muted-foreground">
                Te enviamos un enlace para confirmar tu cuenta. Luego podrás iniciar sesión.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
                Volver
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={login} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="l-email">Correo electrónico</Label>
                    <Input id="l-email" name="email" type="email" autoComplete="email" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="l-pass">Contraseña</Label>
                    <Input id="l-pass" name="password" type="password" autoComplete="current-password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signup} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-nombre">Nombre completo</Label>
                    <Input id="s-nombre" name="nombre" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-email">Correo electrónico</Label>
                    <Input id="s-email" name="email" type="email" autoComplete="email" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-pass">Contraseña</Label>
                    <Input id="s-pass" name="password" type="password" autoComplete="new-password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando cuenta…" : "Crear cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
