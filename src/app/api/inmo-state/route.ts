import { NextResponse } from "next/server";
import type { InmoState } from "@/lib/inmoData";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const adminId = request.headers.get("x-admin-id");

    if (scope !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Use public endpoints instead." },
        {
          status: 404,
          headers: {
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

    const result = await readInmoState({ scope: "admin" });
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
