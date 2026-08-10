import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "../ui/Dialog";
import { SearchInput } from "../ui/Common";
import { appointmentService, doctorService, patientService } from "../../services/domainServices";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { PatientSummary } from "../../types";

export function NewBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const patients = useQuery({
    queryKey: ["patients", "search", patientQuery],
    queryFn: () => patientService.search(patientQuery || undefined),
    enabled: !selectedPatient,
  });
  const doctors = useQuery({ queryKey: ["doctors"], queryFn: () => doctorService.search() });

  const mutation = useMutation({
    mutationFn: () => {
      const scheduled_at = new Date(`${date}T${time}`).toISOString();
      return appointmentService.book({
        doctor_id: doctorId,
        scheduled_at,
        reason: reason || undefined,
        patient_id: selectedPatient?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      showToast("Appointment booked.");
      handleClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleClose = () => {
    setSelectedPatient(null);
    setPatientQuery("");
    setDoctorId("");
    setDate("");
    setTime("");
    setReason("");
    setError(null);
    onClose();
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onClose={handleClose} title="New booking" maxWidth="max-w-lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        {error && <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}

        <div>
          <label className="label">Patient</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
              <span>
                {selectedPatient.full_name} <span className="text-ink/50">· {selectedPatient.email}</span>
              </span>
              <button type="button" className="text-primary-600 hover:underline" onClick={() => setSelectedPatient(null)}>
                Change
              </button>
            </div>
          ) : (
            <>
              <SearchInput value={patientQuery} onChange={setPatientQuery} placeholder="Search patient by name or email…" />
              {patients.data && patients.data.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-line">
                  {patients.data.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface"
                      onClick={() => setSelectedPatient(p)}
                    >
                      {p.full_name} <span className="text-ink/50">· {p.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="label">Doctor</label>
          <select className="input" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Select a doctor…</option>
            {doctors.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} — {d.specialization}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" min={todayStr} required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Reason (optional)</label>
          <textarea className="input min-h-[70px]" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending || !selectedPatient || !doctorId}>
            {mutation.isPending ? "Booking…" : "Book appointment"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
