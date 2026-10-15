import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  LogOut,
  Receipt,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/current-user";

const catalogos = [
  { title: "Artículos", url: "/articulos", icon: Package },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Condiciones de pago", url: "/condiciones", icon: CreditCard },
  { title: "Vendedores", url: "/vendedores", icon: BadgeCheck },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                FacturaPro
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={path === "/panel"} tooltip="Panel">
                      <Link to="/panel">
                        <LayoutDashboard />
                        <span>Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Mantenimientos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {catalogos.map((i) => (
                    <SidebarMenuItem key={i.url}>
                      <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                        <Link to={i.url}>
                          <i.icon />
                          <span>{i.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {user?.role === "admin" && (
              <SidebarGroup>
                <SidebarGroupLabel>Administración</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={path === "/usuarios"} tooltip="Usuarios">
                        <Link to="/usuarios">
                          <ShieldCheck />
                          <span>Usuarios</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <div className="rounded-md bg-sidebar-accent px-3 py-2 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                {user?.nombre ?? "…"}
              </p>
              <p className="text-xs capitalize text-sidebar-foreground/70">
                {user?.role === "admin" ? "Administrador" : user ? "Facturador" : ""}
              </p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Cerrar sesión">
                  <LogOut />
                  <span>Cerrar sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Sistema de Facturación</span>
            <div className="ml-auto md:hidden">
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
