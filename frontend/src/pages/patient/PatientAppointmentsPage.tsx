import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { appointmentService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Appointment } from "../../types";

type Tab = "upcoming" | "history";

export function PatientAppointmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", tab],
    queryFn: () => appointmentService.list({ scope: tab }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      showToast("Appointment cancelled.");
      setCancelTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  return (
    <div>
      <PageHeader title="My appointments" description="Track upcoming visits and review your appointment history." />

      <div className="mb-4 inline-flex rounded-md border border-line bg-panel p-1">
        {(["upcoming", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`rounded px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-primary-600 text-white" : "text-ink/60 hover:text-ink"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : data && data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface/50 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Date & time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-5 py-3 font-medium text-ink">{appt.doctor_name}</td>
                  <td className="px-5 py-3 text-ink/70">{appt.department_name}</td>
                  <td className="px-5 py-3 text-ink/70">{new Date(appt.scheduled_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {appt.status === "pending" && (
                      <button className="text-sm text-danger hover:underline" onClick={() => setCancelTarget(appt)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState icon={CalendarDays} title={`No ${tab} appointments`} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        title="Cancel appointment"
        description={`Cancel your appointment with ${cancelTarget?.doctor_name}? This cannot be undone.`}
        confirmLabel="Cancel appointment"
        danger
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
