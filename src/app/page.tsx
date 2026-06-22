import HomeStitchLite from "@/components/inmo/HomeStitchLite";
import { defaultState } from "@/lib/inmoData";
import { PUBLIC_CACHE_TTL, readThroughCache } from "@/lib/server/responseCache";
import { readPublicHomeListings, readPublicShell } from "@/lib/server/inmoRepository";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 60;

export default async function HomePage() {
  const [{ value: shell }, { value: listings }] = await Promise.all([
    readThroughCache("page:home:shell:v3", PUBLIC_CACHE_TTL.shell, () => readPublicShell("home")),
    readThroughCache("page:home:listings:v2", PUBLIC_CACHE_TTL.homeListings, readPublicHomeListings),
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

  return <HomeStitchLite initialState={initialState} />;
}
