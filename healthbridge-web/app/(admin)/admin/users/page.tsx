"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState }    from "@/components/ui/EmptyState";
import { PageLoader }    from "@/components/ui/Spinner";
import { Badge }         from "@/components/ui/Badge";
import { Users }         from "lucide-react";

// Admin users page — note: there is no user management endpoint in the backend yet.
// This page shows a placeholder with instructions.
export default function AdminUsersPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-400">Manage system users and roles</p>
      </div>

      <Card>
        <EmptyState
          icon={Users}
          title="User management API coming soon"
          message="The auth service currently uses an in-memory store. Once connected to PostgreSQL with a user listing endpoint, users will appear here."
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Reference</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {[
            { role: "patient",  desc: "Can book appointments and view prescriptions",                    color: "violet" },
            { role: "doctor",   desc: "Can manage patients, appointments, and write prescriptions",      color: "primary" },
            { role: "staff",    desc: "Can manage appointments and register patients (receptionist)",    color: "success" },
            { role: "admin",    desc: "Full system access and health monitoring",                        color: "default" },
          ].map(r => (
            <div key={r.role} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <Badge label={r.role} variant={r.color as any} />
              <p className="text-sm text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
