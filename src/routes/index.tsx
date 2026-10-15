import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "FacturaPro · Sistema de Facturación" },
      { name: "description", content: "Sistema de facturación en RD$ para empresas de República Dominicana." },
      { property: "og:title", content: "FacturaPro · Sistema de Facturación" },
      { property: "og:description", content: "Sistema de facturación en RD$ para empresas de República Dominicana." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/panel" : "/auth" });
  },
  component: () => null,
});
