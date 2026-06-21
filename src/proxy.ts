import { NextResponse, type NextRequest } from "next/server";

const pausedClientPaths = new Set(["/acceso", "/registro", "/mi-cuenta", "/confirmar"]);

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.has("_rsc")) {
    const accept = request.headers.get("accept") ?? "";
    const isReactServerComponentRequest = accept.includes("text/x-component");

    if (!isReactServerComponentRequest) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete("_rsc");
      return NextResponse.redirect(cleanUrl);
    }
  }

  if (pausedClientPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/admin/clientes") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/acceso",
    "/registro",
    "/mi-cuenta",
    "/confirmar",
    "/admin/clientes",
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
