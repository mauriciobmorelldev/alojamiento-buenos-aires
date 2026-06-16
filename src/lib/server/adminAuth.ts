import { readInmoState } from "@/lib/server/inmoRepository";

export const getAdminFromRequest = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;
  const result = await readInmoState();
  const admin = result.data.adminUsers.find((item) => item.id === adminId && item.active);
  return admin ? { admin, state: result.data } : null;
};

export const requireOwnerFromRequest = async (request: Request) => {
  const context = await getAdminFromRequest(request);
  if (!context || context.admin.role !== "owner") return null;
  return context;
};
