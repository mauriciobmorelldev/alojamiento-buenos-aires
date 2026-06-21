import { NextResponse } from "next/server";
import type { InmoState } from "@/lib/inmoData";
import { defaultState } from "@/lib/inmoData";
import {
  readInmoState,
  readPublicHomeListings,
  readPublicListings,
  readPublicShell,
  writeInmoState,
} from "@/lib/server/inmoRepository";
import { deleteRemovedStateMedia } from "@/lib/server/mediaStorage";
import { readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const adminId = request.headers.get("x-admin-id");

    if (scope !== "admin") {
      const mode = searchParams.get("mode") === "catalog" ? "catalog" : "home";
      const [shell, listings] = await Promise.all([
        readThroughCache(`public:shell:${mode}:compat:v1`, 5 * 1000, () =>
          readPublicShell(mode)
        ),
        readThroughCache(
          `public:listings:${mode}:compat:v1`,
          5 * 1000,
          mode === "home" ? readPublicHomeListings : readPublicListings
        ),
      ]);
      const source =
        shell.value.source === "supabase" || listings.value.source === "supabase"
          ? "supabase"
          : "fallback";

      const publicPayload = {
        ...shell.value.data,
        ...listings.value.data,
        homeContent: {
          ...(shell.value.data.homeContent ?? {}),
          ...(listings.value.data.homeContent ?? {}),
        },
      } as Partial<InmoState>;
      const publicState = mergeState(defaultState, publicPayload);

      return NextResponse.json(
        publicState,
        {
          headers: {
            "x-inmo-state-source": source,
            "x-inmo-state-scope": `public-compat-${mode}`,
            "x-inmo-cache":
              shell.hit && listings.hit ? "hit" : shell.hit || listings.hit ? "partial" : "miss",
            "x-inmo-state-duration-ms": String(Date.now() - startedAt),
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
          },
        }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
          },
        }
      );
    }

    const adminModeParam = searchParams.get("mode");
    const adminMode =
      adminModeParam === "dashboard" ||
      adminModeParam === "properties" ||
      adminModeParam === "leads" ||
      adminModeParam === "settings"
        ? adminModeParam
        : "full";
    const result = await readInmoState({ scope: "admin", adminMode });
    const admin = result.data.adminUsers.find((item) => item.id === adminId && item.active);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
          },
        }
      );
    }

    return NextResponse.json({
      ...result.data,
      adminUsers: result.data.adminUsers.map((admin) => ({
        ...admin,
        password: "",
      })),
      clientUsers: result.data.clientUsers.map((client) => ({
        ...client,
        password: "",
      })),
    }, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "admin",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo leer Supabase.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const writeSecret = process.env.INMO_STATE_WRITE_SECRET;
    const requestSecret = request.headers.get("x-inmo-write-secret");
    const adminId = request.headers.get("x-admin-id");
    const currentState = await readInmoState();
    const owner = adminId
      ? currentState.data.adminUsers.find(
          (admin) => admin.id === adminId && admin.active && admin.role === "owner"
        )
      : null;

    if ((!writeSecret || requestSecret !== writeSecret) && !owner) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = (await request.json()) as InmoState;
    const result = await writeInmoState(state);
    if (result.source === "supabase") {
      try {
        await deleteRemovedStateMedia(currentState.data, state);
      } catch (cleanupError) {
        console.warn("No se pudieron borrar medios removidos", cleanupError);
      }
    }
    return NextResponse.json({ ok: true, source: result.source });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo escribir en Supabase.",
      },
      { status: 500 }
    );
  }
}
