"use client";
import { useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/store/auth.store";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function PageLayout({ children, title, actions }: PageLayoutProps) {
  const { hydrate } = useAuthStore();

  const stableHydrate = useCallback(hydrate, []);
  useEffect(() => {
    stableHydrate();
  }, [stableHydrate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Optional topbar */}
        {title && (
          <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8">
            <h1 className="font-display text-xl font-bold text-slate-900">{title}</h1>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
