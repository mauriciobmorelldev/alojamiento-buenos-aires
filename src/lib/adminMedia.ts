export type AdminMediaKind = "image" | "video";

export const uploadAdminMedia = async (
  file: File,
  kind: AdminMediaKind,
  adminId?: string
) => {
  if (!adminId) {
    throw new Error("Iniciá sesión para subir archivos.");
  }

  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    headers: {
      "x-admin-id": adminId,
    },
    body: formData,
  });
  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    url?: string;
    error?: string;
  } | null;

  if (!response.ok || !result?.ok || !result.url) {
    throw new Error(result?.error ?? "No se pudo subir el archivo.");
  }

  return result.url;
};
