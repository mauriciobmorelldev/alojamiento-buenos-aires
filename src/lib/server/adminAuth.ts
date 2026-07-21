import { type AdminRole } from "@/lib/inmoData";
import { readInmoState } from "@/lib/server/inmoRepository";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

const getLocalAdminContext = async (adminId: string) => {
  const { data } = await readInmoState({ scope: "admin", adminMode: "settings" });
  const admin = data.adminUsers.find((item) => item.id === adminId && item.active);
  if (!admin) return null;
  return {
    admin: {
      ...admin,
      password: "",
    },
    state: data,
  };
};

export const getAdminFromRequest = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;

  const supabaseConfigured = isSupabaseConfigured();
  const allowLocalAdminFallback = !supabaseConfigured || process.env.NODE_ENV !== "production";
  if (allowLocalAdminFallback) {
    const localContext = await getLocalAdminContext(adminId);
    if (localContext) return localContext;
  }

  const supabase = getSupabaseServerClient();

  if (supabase && supabaseConfigured) {
    const result = await supabase
      .from("profiles")
      .select("id,name,email,role,phone,active")
      .eq("id", adminId)
      .eq("kind", "admin")
      .maybeSingle();
    const profile = result.data;
    if (!result.error && profile?.active) {
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
        state: (await readInmoState({ scope: "admin", adminMode: "settings" })).data,
      };
    }
  }

  if (!allowLocalAdminFallback) return null;
  return getLocalAdminContext(adminId);
};

export const requireOwnerFromRequest = async (request: Request) => {
  const context = await getAdminFromRequest(request);
  if (!context || context.admin.role !== "owner") return null;
  return context;
};
