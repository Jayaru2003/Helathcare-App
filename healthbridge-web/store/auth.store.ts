"use client";
import { create } from "zustand";
import { api } from "@/lib/axios";
import { decodeJwt, roleDashboard } from "@/lib/utils";
import Cookies from "js-cookie";
import type { User, AuthTokens } from "@/types";

interface LoginPayload    { email: string; password: string }
interface RegisterPayload { email: string; password: string; firstName: string; lastName: string; role: string; phoneNumber?: string }

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload, router: { push: (p: string) => void }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: (router: { push: (p: string) => void }) => Promise<void>;
  clearError: () => void;
}

function parseError(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message ?? err?.message ?? "Something went wrong";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  isLoading: false,
  error:     null,

  clearError: () => set({ error: null }),

  /** Re-hydrate user from stored token on page load */
  hydrate: async () => {
    const token = Cookies.get("hb_token");
    if (!token) return;
    // Try to get fresh user from /api/auth/me
    try {
      const res = await api.get("/api/auth/me");
      const data = res.data?.data;
      // Supplement with cookie-stored name fields
      const stored = (() => {
        try { return JSON.parse(Cookies.get("hb_user") ?? "{}"); } catch { return {}; }
      })();
      set({ user: { ...stored, ...data } });
    } catch {
      // Fallback: decode from JWT
      const payload = decodeJwt(token);
      if (payload) {
        const stored = (() => {
          try { return JSON.parse(Cookies.get("hb_user") ?? "{}"); } catch { return {}; }
        })();
        set({ user: { id: payload.sub as string, email: payload.email as string, role: payload.role as string, ...stored } });
      }
    }
  },

  /** Login: POST /api/auth/login → store tokens → decode JWT for user info */
  login: async (payload, router) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ data: AuthTokens }>("/api/auth/login", payload);
      const { accessToken, refreshToken } = res.data.data;

      // Store tokens in cookies
      Cookies.set("hb_token",   accessToken,  { expires: 1 });       // 1 day (token itself expires in 15m, refresh handles it)
      Cookies.set("hb_refresh", refreshToken, { expires: 7 });

      // Decode JWT to get user info (no user returned from login endpoint)
      const jwtPayload = decodeJwt(accessToken);
      const user: User = {
        id:    jwtPayload?.sub as string,
        email: jwtPayload?.email as string ?? payload.email,
        role:  jwtPayload?.role as string ?? "patient",
      };
      Cookies.set("hb_user", JSON.stringify(user), { expires: 7 });
      set({ user, isLoading: false });
      router.push(roleDashboard(user.role));
    } catch (e) {
      set({ error: parseError(e), isLoading: false });
      throw e;
    }
  },

  /** Register: POST /api/auth/register → redirect to login */
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/api/auth/register", payload);
      set({ isLoading: false });
    } catch (e) {
      set({ error: parseError(e), isLoading: false });
      throw e;
    }
  },

  /** Logout: call /api/auth/logout to revoke token, clear cookies */
  logout: async (router) => {
    try {
      await api.post("/api/auth/logout");
    } catch { /* ignore errors */ }
    Cookies.remove("hb_token");
    Cookies.remove("hb_refresh");
    Cookies.remove("hb_user");
    set({ user: null });
    router.push("/login");
  },
}));
