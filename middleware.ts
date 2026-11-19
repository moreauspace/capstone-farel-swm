import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/warehouse/:path*",
    "/procurement/:path*",
    "/users/:path*",
    "/portal/:path*",
    "/notifications/:path*",
  ],
};
