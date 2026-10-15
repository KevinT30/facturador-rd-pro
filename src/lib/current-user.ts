import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "facturador";
export type CurrentUser = { id: string; email: string; nombre: string; role: AppRole };

export const currentUserQuery = queryOptions({
  queryKey: ["current-user"],
  queryFn: async (): Promise<CurrentUser | null> => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const [{ data: profile }, { data: role }] = await Promise.all([
      supabase.from("profiles").select("nombre,email").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);
    return {
      id: user.id,
      email: user.email ?? "",
      nombre: profile?.nombre || user.email || "",
      role: (role?.role as AppRole) ?? "facturador",
    };
  },
});

export function useCurrentUser() {
  return useQuery(currentUserQuery).data ?? null;
}
