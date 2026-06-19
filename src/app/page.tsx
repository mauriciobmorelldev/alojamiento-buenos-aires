import HomeStitchLite from "@/components/inmo/HomeStitchLite";
import { defaultState } from "@/lib/inmoData";
import { readPublicListings, readPublicShell } from "@/lib/server/inmoRepository";
import { mergeState } from "@/lib/stateMerge";

export default async function HomePage() {
  const [shell, listings] = await Promise.all([
    readPublicShell("home"),
    readPublicListings(),
  ]);
  const initialState = mergeState(defaultState, {
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
