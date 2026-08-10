import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService } from "../../services/domainServices";
import { AppointmentDetailDialog } from "../../components/doctor/AppointmentDetailDialog";
import type { Appointment, AppointmentStatus } from "../../types";

export function DoctorAppointmentsPage() {
  const [searchParams] = useSearchParams();
  const scope = searchParams.get("scope") || "all";
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [selected, setSelected] = useState<Appointment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", scope, statusFilter],
    queryFn: () => appointmentService.list({ scope, status: statusFilter || undefined }),
  });

  return (
    <div>
      <PageHeader
        title={scope === "today" ? "Today's appointments" : "All appointments"}
        description="Review patient details and manage the visit workflow."
        action={
          <select className="input w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "")}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : data && data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/50 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Date & time</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((appt) => (
                <tr key={appt.id} className="cursor-pointer hover:bg-surface/50" onClick={() => setSelected(appt)}>
                  <td className="px-5 py-3 font-medium text-ink">{appt.patient_name}</td>
                  <td className="px-5 py-3 text-ink/70">{new Date(appt.scheduled_at).toLocaleString()}</td>
                  <td className="px-5 py-3 text-ink/70">{appt.reason || "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState icon={CalendarDays} title="No appointments found" />
          </div>
        )}
      </div>

      {selected && <AppointmentDetailDialog appointment={selected} open={!!selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
