import AbaCatalog from "@/components/aba/AbaCatalog";
import { defaultState } from "@/lib/inmoData";
import {
  readPublicListingsPage,
  readPublicShell,
} from "@/lib/server/inmoRepository";
import { mergeState } from "@/lib/stateMerge";

export const revalidate = 60;

export default async function DepartamentosPage() {
  const [shell, listings] = await Promise.all([
    readPublicShell("catalog"),
    readPublicListingsPage({ page: 1, pageSize: 24 }),
  ]);
  const initialState = mergeState(defaultState, {
    ...shell.data,
    ...listings.data,
  });

  return <AbaCatalog initialState={initialState} />;
}
