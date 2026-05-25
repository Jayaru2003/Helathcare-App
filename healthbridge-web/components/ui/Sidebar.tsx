"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  LayoutDashboard, Users, Calendar, FileText, LogOut,
  Activity, Receipt, Shield, Stethoscope,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ElementType;
}

const navByRole: Record<string, NavItem[]> = {
  doctor: [
    { label: "Dashboard",     href: "/doctor/dashboard",     icon: LayoutDashboard },
    { label: "Patients",      href: "/doctor/patients",      icon: Users           },
    { label: "Appointments",  href: "/doctor/appointments",  icon: Calendar        },
    { label: "Prescriptions", href: "/doctor/prescriptions", icon: FileText        },
  ],
  patient: [
    { label: "Dashboard",     href: "/patient/dashboard",     icon: LayoutDashboard },
    { label: "Appointments",  href: "/patient/appointments",  icon: Calendar        },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: FileText        },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users",     href: "/admin/users",     icon: Users           },
  ],

  staff: [
    { label: "Dashboard",    href: "/staff/dashboard",    icon: LayoutDashboard },
    { label: "Patients",     href: "/staff/patients",     icon: Users           },
    { label: "Appointments", href: "/staff/appointments", icon: Calendar        },
  ],
};

const roleColors: Record<string, string> = {
  doctor:  "from-brand-500 to-blue-600",
  patient: "from-violet-500 to-purple-600",
  admin:   "from-slate-600 to-slate-800",
  staff:   "from-teal-500 to-emerald-600",
};

const roleIcons: Record<string, React.ElementType> = {
  doctor:  Stethoscope,
  patient: Activity,
  admin:   Shield,
  staff:   Receipt,
};

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router   = useRouter();
  const role     = user?.role ?? "patient";
  const nav      = navByRole[role] ?? [];
  const gradient = roleColors[role] ?? roleColors.patient;
  const RoleIcon = roleIcons[role] ?? Activity;

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-50">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", gradient)}>
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-display text-base font-bold text-slate-900">HealthBridge</span>
          <p className="text-xs text-slate-400 capitalize">{role} portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-50 p-3">
        {/* Role badge */}
        <div className={cn("mb-2 flex items-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-r opacity-90", gradient)}>
          <RoleIcon className="h-3.5 w-3.5 text-white/80" />
          <span className="text-xs font-semibold text-white/90 capitalize">{role}</span>
        </div>

        {/* User info */}
        <div className="mb-1 flex items-center gap-3 px-1">
          <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", gradient)}>
            {user?.firstName ? initials(user.firstName, user.lastName) : user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email ?? "User"}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          id="sidebar-logout-btn"
          onClick={() => logout(router)}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
