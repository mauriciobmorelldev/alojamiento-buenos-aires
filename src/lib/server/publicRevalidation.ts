import { revalidatePath } from "next/cache";

const publicIndexPaths = [
  "/",
  "/propiedades",
  "/departamentos",
  "/vivir-buenos-aires",
];

export const revalidatePublicContent = (options?: {
  propertyId?: string;
  editorialSlug?: string;
}) => {
  publicIndexPaths.forEach((path) => revalidatePath(path));

  if (options?.propertyId) {
    revalidatePath(`/propiedades/${options.propertyId}`);
    revalidatePath(`/departamentos/${options.propertyId}`);
  }
  if (options?.editorialSlug) {
    revalidatePath(`/vivir-buenos-aires/${options.editorialSlug}`);
  }
};
