import { NextResponse } from "next/server";
import {
  readInmoState,
  writeInmoState,
} from "@/lib/server/inmoRepository";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { readTokkoSettings, syncTokkoProperties } from "@/lib/server/tokko";

export async function POST(request: Request) {
  const ownerContext = await requireOwnerFromRequest(request);
  const settings = await readTokkoSettings();
  const syncSecret = settings.syncSecret || process.env.TOKKO_SYNC_SECRET;
  const requestSecret = request.headers.get("x-tokko-sync-secret");
  if (!ownerContext && (!syncSecret || requestSecret !== syncSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await readInmoState();
  const nextState = await syncTokkoProperties(data);
  await writeInmoState(nextState);
  const log = nextState.tokkoSyncLogs[0] ?? null;
  return NextResponse.json({
    ok: true,
    log,
  });
}
