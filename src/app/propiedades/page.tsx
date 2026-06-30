import ResultsStitch from "@/components/inmo/ResultsStitch";
import { defaultState } from "@/lib/inmoData";
import {
  readPublicListingsPage,
  readPublicShell,
  type PublicListingsPageOptions,
} from "@/lib/server/inmoRepository";
import { PUBLIC_CACHE_TTL, readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 60;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ResultadosBusquedaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageOptions: PublicListingsPageOptions = {
    page: Number(firstValue(params?.page) ?? 1),
    pageSize: 12,
    query: firstValue(params?.q) ?? "",
    type: firstValue(params?.type) ?? "all",
    operation: firstValue(params?.operacion) ?? firstValue(params?.operation) ?? "all",
    minRooms:
      firstValue(params?.minRooms) && firstValue(params?.minRooms) !== "all"
        ? Number(firstValue(params?.minRooms))
        : undefined,
    sort: firstValue(params?.sort) ?? "featured",
  };
  const [{ value: shell }, { value: listings }] = await Promise.all([
    readThroughCache("page:catalog:shell:v2", PUBLIC_CACHE_TTL.shell, () =>
      readPublicShell("catalog")
    ),
    readThroughCache(
      `page:catalog:listings:v2:${JSON.stringify(pageOptions)}`,
      PUBLIC_CACHE_TTL.catalogListings,
      () => readPublicListingsPage(pageOptions)
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
      initialPage={pageOptions.page}
    />
  );
}
