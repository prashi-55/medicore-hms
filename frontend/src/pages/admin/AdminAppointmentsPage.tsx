import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService } from "../../services/domainServices";
import type { AppointmentStatus } from "../../types";

export function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "admin", statusFilter],
    queryFn: () => appointmentService.list({ status: statusFilter || undefined }),
  });

  return (
    <div>
      <PageHeader
        title="All appointments"
        description="System-wide appointment oversight."
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
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Date & time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-5 py-3 font-medium text-ink">{appt.patient_name}</td>
                  <td className="px-5 py-3 text-ink/70">{appt.doctor_name}</td>
                  <td className="px-5 py-3 text-ink/70">{appt.department_name}</td>
                  <td className="px-5 py-3 text-ink/70">{new Date(appt.scheduled_at).toLocaleString()}</td>
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
    </div>
  );
}
