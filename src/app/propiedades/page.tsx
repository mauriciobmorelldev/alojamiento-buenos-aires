import ResultsStitch from "@/components/inmo/ResultsStitch";
import { defaultState } from "@/lib/inmoData";
import {
  readPublicListingsPage,
  readPublicShell,
} from "@/lib/server/inmoRepository";
import { PUBLIC_CACHE_TTL, readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 300;

export default async function ResultadosBusquedaPage() {
  const [{ value: shell }, { value: listings }] = await Promise.all([
    readThroughCache("page:catalog:shell:v2", PUBLIC_CACHE_TTL.shell, () =>
      readPublicShell("catalog")
    ),
    readThroughCache(
      "page:catalog:listings:v3:default",
      PUBLIC_CACHE_TTL.catalogListings,
      () => readPublicListingsPage({ page: 1, pageSize: 12 })
    ),
  ]);
  const initialState = mergeState({ ...defaultState, listings: [] }, {
    ...shell.data,
    ...listings.data,
  });
  initialState.adminUsers = initialState.adminUsers.map((admin) => ({
    ...admin,
    password: "__public__",
    phone: "",
  }));
  initialState.clientUsers = [];
  initialState.clientContracts = [];
  initialState.propertyFavorites = [];
  initialState.leads = [];
  initialState.leadEvents = [];
  initialState.propertyMetrics = [];
  initialState.tokkoSyncLogs = [];

  return (
    <ResultsStitch
      initialState={initialState}
      initialPagination={listings.data.pagination}
      initialPage={1}
    />
  );
}
