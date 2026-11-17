import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const protectedPaths = ["/dashboard", "/editor", "/generate", "/projects", "/history", "/settings"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  if (protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && !request.auth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
  if ((pathname === "/login" || pathname === "/register") && request.auth) return Response.redirect(new URL("/dashboard", request.url));
});

export const config = { matcher: ["/dashboard/:path*", "/editor/:path*", "/generate/:path*", "/projects/:path*", "/history/:path*", "/settings/:path*", "/login", "/register"] };
