import { NextResponse, type NextRequest } from "next/server";

const pausedClientPaths = new Set(["/acceso", "/registro", "/mi-cuenta", "/confirmar"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pausedClientPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/admin/clientes") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/acceso", "/registro", "/mi-cuenta", "/confirmar", "/admin/clientes"],
};
