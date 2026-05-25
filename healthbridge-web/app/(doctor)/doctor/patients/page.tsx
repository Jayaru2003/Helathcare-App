"use client";
import { useEffect, useState, useCallback } from "react";
import { patientService }  from "@/services/patient.service";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge }           from "@/components/ui/Badge";
import { Input }           from "@/components/ui/Input";
import { EmptyState }      from "@/components/ui/EmptyState";
import { PageLoader }      from "@/components/ui/Spinner";
import { Pagination }      from "@/components/ui/Pagination";
import { Search, User2 }  from "lucide-react";
import { initials, formatDate, statusVariant } from "@/lib/utils";
import type { Patient }    from "@/types";

export default function DoctorPatientsPage() {
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotal]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getAll(page, LIMIT);
      setPatients(res.data ?? []);
      setTotal(res.meta?.totalPages ?? 1);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.email} ${p.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-sm text-slate-400">Manage and view patient records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Patients</CardTitle>
          <div className="w-64">
            <Input
              placeholder="Search by name, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftAddon={<Search className="h-4 w-4" />}
            />
          </div>
        </CardHeader>

        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState type="search" title="No patients found" message="Try adjusting your search, or patients will appear once they register." />
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-4 py-3.5 hover:bg-slate-50/50 rounded-xl px-2 -mx-2 transition-colors">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-blue-500 text-sm font-bold text-white shadow-sm">
                    {initials(p.firstName, p.lastName)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{p.email} · {p.phoneNumber}</p>
                  </div>
                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1">
                    {p.dateOfBirth && (
                      <p className="text-xs text-slate-400">DOB: {formatDate(p.dateOfBirth)}</p>
                    )}
                    {p.bloodType && (
                      <Badge label={p.bloodType} variant="info" size="sm" />
                    )}
                  </div>
                  <Badge label={p.isActive === false ? "inactive" : "active"} variant={statusVariant(p.isActive === false ? "inactive" : "active") as any} dot />
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              hasNext={page < totalPages}
              hasPrev={page > 1}
              onNext={() => setPage(p => p + 1)}
              onPrev={() => setPage(p => p - 1)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
