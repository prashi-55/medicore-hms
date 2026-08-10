import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { appointmentService } from "../../services/domainServices";
import { NewBookingDialog } from "../../components/receptionist/NewBookingDialog";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Appointment, AppointmentStatus } from "../../types";

export function ReceptionistAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "all", statusFilter],
    queryFn: () => appointmentService.list({ status: statusFilter || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["appointments"] });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentService.updateStatus(id, "confirmed"),
    onSuccess: () => {
      invalidate();
      showToast("Appointment confirmed.");
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: () => {
      invalidate();
      showToast("Appointment cancelled.");
      setCancelTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      const scheduled_at = new Date(`${newDate}T${newTime}`).toISOString();
      return appointmentService.reschedule(rescheduleTarget!.id, scheduled_at);
    },
    onSuccess: () => {
      invalidate();
      showToast("Appointment rescheduled.");
      setRescheduleTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book, confirm, reschedule, or cancel appointments."
        action={
          <div className="flex gap-2">
            <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "")}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-primary" onClick={() => setBookingOpen(true)}>
              <CalendarPlus size={16} /> New booking
            </button>
          </div>
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
                <th className="px-5 py-3">Date & time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-5 py-3 font-medium text-ink">{appt.patient_name}</td>
                  <td className="px-5 py-3 text-ink/70">{appt.doctor_name}</td>
                  <td className="px-5 py-3 text-ink/70">{new Date(appt.scheduled_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3 text-sm">
                      {appt.status === "pending" && (
                        <button className="text-primary-600 hover:underline" onClick={() => confirmMutation.mutate(appt.id)}>
                          Confirm
                        </button>
                      )}
                      {(appt.status === "pending" || appt.status === "confirmed") && (
                        <button
                          className="text-ink/60 hover:underline"
                          onClick={() => {
                            setRescheduleTarget(appt);
                            setNewDate("");
                            setNewTime("");
                          }}
                        >
                          Reschedule
                        </button>
                      )}
                      {(appt.status === "pending" || appt.status === "confirmed") && (
                        <button className="text-danger hover:underline" onClick={() => setCancelTarget(appt)}>
                          Cancel
                        </button>
                      )}
                    </div>
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

      <NewBookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        title="Cancel appointment"
        description={`Cancel ${cancelTarget?.patient_name}'s appointment with ${cancelTarget?.doctor_name}?`}
        confirmLabel="Cancel appointment"
        danger
        loading={cancelMutation.isPending}
      />

      <Dialog open={!!rescheduleTarget} onClose={() => setRescheduleTarget(null)} title="Reschedule appointment">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            rescheduleMutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">New date</label>
              <input type="date" className="input" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="label">New time</label>
              <input type="time" className="input" required value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={rescheduleMutation.isPending}>
              {rescheduleMutation.isPending ? "Saving…" : "Reschedule"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
