import AbaCatalog from "@/components/aba/AbaCatalog";
import { defaultState } from "@/lib/inmoData";
import {
  readPublicListingsPage,
  readPublicShell,
} from "@/lib/server/inmoRepository";
import { PUBLIC_CACHE_TTL, readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 3600;

export default async function DepartamentosPage() {
  const [{ value: shell }, { value: listings }] = await Promise.all([
    readThroughCache("page:departamentos:shell:v1", PUBLIC_CACHE_TTL.shell, () =>
      readPublicShell("catalog")
    ),
    readThroughCache(
      "page:departamentos:listings:v1",
      PUBLIC_CACHE_TTL.catalogListings,
      () => readPublicListingsPage({ page: 1, pageSize: 24 })
    ),
  ]);
  const initialState = mergeState(defaultState, {
    ...shell.data,
    ...listings.data,
  });

  return <AbaCatalog initialState={initialState} />;
}
