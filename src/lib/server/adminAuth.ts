import { defaultState, type AdminRole } from "@/lib/inmoData";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const getAdminFromRequest = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) return null;
  const result = await supabase
    .from("profiles")
    .select("id,name,email,role,phone,active")
    .eq("id", adminId)
    .eq("kind", "admin")
    .maybeSingle();
  const profile = result.data;
  if (result.error || !profile?.active) return null;
  return {
    admin: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      password: "",
      role: (profile.role === "owner" ? "owner" : "colaborador") as AdminRole,
      phone: profile.phone ?? "",
      active: true,
    },
    state: defaultState,
  };
};

export const requireOwnerFromRequest = async (request: Request) => {
  const context = await getAdminFromRequest(request);
  if (!context || context.admin.role !== "owner") return null;
  return context;
};
