import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET || "satya-wira-demo-7f3c9a1e2b4d6f8091a2b3c4d5e6f7089ab";

async function sessionToken(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = forwarded === "https" || req.nextUrl.protocol === "https:";
  return (
    (await getToken({ req, secret, secureCookie: secure })) ??
    (await getToken({ req, secret, secureCookie: !secure }))
  );
}

export async function middleware(req: NextRequest) {
  const token = await sessionToken(req);
  if (token) return NextResponse.next();
  const login = req.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/warehouse/:path*",
    "/procurement/:path*",
    "/users/:path*",
    "/portal/:path*",
    "/notifications/:path*",
    "/buka/:path*",
  ],
};
