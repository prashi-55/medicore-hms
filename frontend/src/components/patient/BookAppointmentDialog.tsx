import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "../ui/Dialog";
import { appointmentService } from "../../services/domainServices";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { Doctor, PatientSummary } from "../../types";

export function BookAppointmentDialog({
  doctor,
  open,
  onClose,
  patient,
}: {
  doctor: Doctor;
  open: boolean;
  onClose: () => void;
  /** When provided, this dialog is being used by a receptionist booking on behalf of a patient. */
  patient?: PatientSummary;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const scheduled_at = new Date(`${date}T${time}`).toISOString();
      return appointmentService.book({
        doctor_id: doctor.id,
        scheduled_at,
        reason: reason || undefined,
        patient_id: patient?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      showToast("Appointment booked successfully.");
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onClose={onClose} title={`Book with ${doctor.full_name}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        {patient && (
          <div className="rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-700">
            Booking for <strong>{patient.full_name}</strong>
          </div>
        )}
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              min={todayStr}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Reason for visit (optional)</label>
          <textarea
            className="input min-h-[80px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for the visit"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
