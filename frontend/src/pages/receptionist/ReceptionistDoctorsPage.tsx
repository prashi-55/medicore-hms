import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Clock } from "lucide-react";
import { PageHeader, SearchInput } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { doctorService } from "../../services/domainServices";

export function ReceptionistDoctorsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["doctors", q], queryFn: () => doctorService.search({ q: q || undefined }) });

  return (
    <div>
      <PageHeader title="Doctors" description="Check specialization and availability before booking." />

      <div className="mb-4 max-w-sm">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name or specialization…" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((doc) => (
            <div key={doc.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="font-medium text-ink">{doc.full_name}</p>
                  <p className="text-sm text-ink/60">
                    {doc.specialization} · {doc.department_name}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-ink/60">
                <Clock size={14} />
                {doc.available_days || "Availability not set"}
                {doc.available_start_time && ` · ${doc.available_start_time}–${doc.available_end_time}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Stethoscope} title="No doctors found" />
      )}
    </div>
  );
}
