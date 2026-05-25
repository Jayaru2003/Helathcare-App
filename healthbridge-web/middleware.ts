import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

// Role → allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  patient: ["/patient"],
  doctor:  ["/doctor"],
  admin:   ["/admin"],
  staff:   ["/staff"],
};


function getRole(token: string): string | null {
  try {
    const base64 = token.split(".")[1];
    const payload = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token   = request.cookies.get("hb_token")?.value;
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Not authenticated → redirect to login (unless already on a public path)
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on login/register → redirect to their dashboard
  if (token && isPublic) {
    const role = getRole(token);
    const dest = role === "doctor"  ? "/doctor/dashboard"
               : role === "admin"   ? "/admin/dashboard"
               : role === "staff"   ? "/staff/dashboard"
               : "/patient/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url);
  }

  // Authenticated on a role-specific path → verify they belong there
  if (token) {
    const role = getRole(token);
    if (role) {
      const allowed = ROLE_PATHS[role] ?? [];
      const onRolePath = Object.values(ROLE_PATHS).flat().some((p) => pathname.startsWith(p));
      if (onRolePath && !allowed.some((p) => pathname.startsWith(p))) {
        // Wrong role → send to their correct dashboard
        const dest = roleDashboard(role);
        const url = request.nextUrl.clone();
        url.pathname = dest;
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

function roleDashboard(role: string): string {
  const map: Record<string, string> = {
    doctor:  "/doctor/dashboard",
    patient: "/patient/dashboard",
    admin:   "/admin/dashboard",
    staff:   "/staff/dashboard",
  };
  return map[role] ?? "/login";
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"],
};
