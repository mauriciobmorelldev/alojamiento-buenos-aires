import WorkWithUsPage from "@/components/inmo/WorkWithUsPage";
import { defaultState } from "@/lib/inmoData";
import { readPublicShell } from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 10;

export default async function TrabajaConNosotrosPage() {
  const { value: shell } = await readThroughCache(
    "page:work-with-us:shell:v1",
    5 * 1000,
    () => readPublicShell("home")
  );
  const initialState = mergeState({ ...defaultState, listings: [] }, shell.data);
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
  initialState.listings = [];

  return <WorkWithUsPage initialState={initialState} />;
}
