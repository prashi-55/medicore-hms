import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, BadgeCheck, Wallet, Clock } from "lucide-react";
import { PageHeader, SearchInput } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { doctorService, departmentService } from "../../services/domainServices";
import { BookAppointmentDialog } from "../../components/patient/BookAppointmentDialog";
import type { Doctor } from "../../types";

export function DoctorSearchPage() {
  const [q, setQ] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentService.list });
  const doctors = useQuery({
    queryKey: ["doctors", q, departmentId],
    queryFn: () => doctorService.search({ q: q || undefined, department_id: departmentId || undefined }),
  });

  const filteredDeptOptions = useMemo(() => departments.data ?? [], [departments.data]);

  return (
    <div>
      <PageHeader title="Find a doctor" description="Search by name or specialization, then book an appointment." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name or specialization…" />
        </div>
        <select className="input sm:w-56" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {filteredDeptOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {doctors.isLoading ? (
        <TableSkeleton rows={4} />
      ) : doctors.data && doctors.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.data.map((doc) => (
            <div key={doc.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="font-medium text-ink">{doc.full_name}</p>
                  <p className="text-sm text-ink/60">{doc.specialization}</p>
                </div>
              </div>
              <div className="mt-4 flex-1 space-y-1.5 text-sm text-ink/60">
                <p className="flex items-center gap-1.5">
                  <BadgeCheck size={14} /> {doc.department_name} · {doc.years_of_experience} yrs experience
                </p>
                {doc.consultation_fee != null && (
                  <p className="flex items-center gap-1.5">
                    <Wallet size={14} /> ${doc.consultation_fee.toFixed(2)} consultation fee
                  </p>
                )}
                {doc.available_days && (
                  <p className="flex items-center gap-1.5">
                    <Clock size={14} /> {doc.available_days}{" "}
                    {doc.available_start_time && `· ${doc.available_start_time}–${doc.available_end_time}`}
                  </p>
                )}
              </div>
              <button className="btn-primary mt-4 w-full" onClick={() => setBookingDoctor(doc)}>
                Book appointment
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Try a different search term or department." />
      )}

      {bookingDoctor && (
        <BookAppointmentDialog doctor={bookingDoctor} open={!!bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}
    </div>
  );
}
