import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { appointmentService, prescriptionService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Appointment, PrescriptionItem } from "../../types";

const emptyItem: PrescriptionItem = {
  medicine_name: "",
  dosage: "",
  frequency: "",
  duration_days: 7,
  instructions: "",
};

export function AppointmentDetailDialog({
  appointment,
  open,
  onClose,
}: {
  appointment: Appointment;
  open: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [diagnosis, setDiagnosis] = useState(appointment.diagnosis ?? "");
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { ...emptyItem },
  ]);
  const [rxNotes, setRxNotes] = useState("");

  useEffect(() => {
    setDiagnosis(appointment.diagnosis ?? "");
    setNotes(appointment.notes ?? "");
  }, [appointment]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  const confirmMutation = useMutation({
    mutationFn: () =>
      appointmentService.updateStatus(appointment.id, "confirmed"),
    onSuccess: () => {
      invalidate();
      showToast("Appointment confirmed.");
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      appointmentService.updateStatus(appointment.id, "completed"),
    onSuccess: () => {
      invalidate();
      showToast("Appointment marked completed.");
      onClose();
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const diagnosisMutation = useMutation({
    mutationFn: () =>
      appointmentService.addDiagnosis(
        appointment.id,
        diagnosis,
        notes
      ),
    onSuccess: () => {
      invalidate();
      showToast("Diagnosis saved.");
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const prescriptionMutation = useMutation({
    mutationFn: () =>
      prescriptionService.create({
        appointment_id: appointment.id,
        notes: rxNotes || undefined,
        items: items.filter((i) => i.medicine_name.trim()),
      }),
    onSuccess: () => {
      invalidate();
      showToast("Prescription created.");
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const updateItem = (
    idx: number,
    field: keyof PrescriptionItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const canEditDiagnosis =
    appointment.status === "confirmed" ||
    appointment.status === "completed";

  const canPrescribe =
    appointment.status === "confirmed" &&
    !appointment.has_prescription;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Appointment · ${appointment.patient_name}`}
      maxWidth="max-w-4xl"
    >
      <p className="mb-4 text-sm text-ink/60">
        {new Date(appointment.scheduled_at).toLocaleString()}
      </p>

      {appointment.reason && (
        <p className="mb-4 rounded-md bg-surface px-3 py-2 text-sm text-ink/70">
          <span className="font-medium text-ink">Reason: </span>
          {appointment.reason}
        </p>
      )}

      {/* Appointment actions */}
      <div className="mb-4 flex gap-2">
        {appointment.status === "pending" && (
          <button
            className="btn-primary"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending
              ? "Confirming…"
              : "Confirm appointment"}
          </button>
        )}

        {appointment.status === "confirmed" && (
          <button
            className="btn-secondary"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending
              ? "Completing…"
              : "Mark as completed"}
          </button>
        )}
      </div>

      {/* Diagnosis */}
      {canEditDiagnosis && (
        <div className="mb-5 space-y-3 border-t border-line pt-4">
          <h4 className="font-medium text-ink">
            Diagnosis
          </h4>

          <textarea
            className="input min-h-[70px] w-full"
            placeholder="Diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={appointment.status === "completed"}
          />

          <textarea
            className="input min-h-[60px] w-full"
            placeholder="Additional notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={appointment.status === "completed"}
          />

          {appointment.status !== "completed" && (
            <button
              className="btn-outline"
              onClick={() => diagnosisMutation.mutate()}
              disabled={
                diagnosisMutation.isPending ||
                !diagnosis.trim()
              }
            >
              {diagnosisMutation.isPending
                ? "Saving…"
                : "Save diagnosis"}
            </button>
          )}
        </div>
      )}

      {/* Prescription */}
      {canPrescribe && (
        <div className="space-y-4 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-ink">
                Create prescription
              </h4>

              <p className="mt-1 text-xs text-ink/50">
                Add the medicines and instructions prescribed for
                this patient.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  { ...emptyItem },
                ])
              }
            >
              <Plus size={15} />
              Add medicine
            </button>
          </div>

          {/* Medicine items */}
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-line bg-surface/30 p-4"
            >
              {/* Medicine header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">
                  Medicine {idx + 1}
                </p>

                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() =>
                    setItems((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  disabled={items.length === 1}
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>

              {/* Medicine name */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Medicine name
                </label>

                <input
                  className="input w-full"
                  placeholder="e.g. Paracetamol"
                  value={item.medicine_name}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      "medicine_name",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Dosage + Frequency */}
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Dosage
                  </label>

                  <input
                    className="input w-full"
                    placeholder="e.g. 500 mg"
                    value={item.dosage}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "dosage",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Frequency
                  </label>

                  <input
                    className="input w-full"
                    placeholder="e.g. Twice daily"
                    value={item.frequency}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "frequency",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Duration + Instructions */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Duration
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="input w-full"
                      value={item.duration_days}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "duration_days",
                          Number(e.target.value)
                        )
                      }
                    />

                    <span className="whitespace-nowrap text-sm text-ink/60">
                      days
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Instructions
                  </label>

                  <input
                    className="input w-full"
                    placeholder="e.g. After food"
                    value={item.instructions ?? ""}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "instructions",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Prescription notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Prescription notes
              <span className="ml-1 font-normal text-ink/40">
                (optional)
              </span>
            </label>

            <textarea
              className="input min-h-[80px] w-full"
              placeholder="Add any additional instructions for the patient..."
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
            />
          </div>

          {/* Save prescription */}
          <button
            className="btn-primary"
            onClick={() => prescriptionMutation.mutate()}
            disabled={
              prescriptionMutation.isPending ||
              items.every(
                (i) => !i.medicine_name.trim()
              )
            }
          >
            {prescriptionMutation.isPending
              ? "Saving…"
              : "Save prescription"}
          </button>
        </div>
      )}

      {/* Already prescribed */}
      {appointment.has_prescription && (
        <p className="mt-4 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          A prescription has been issued for this appointment.
        </p>
      )}
    </Dialog>
  );
}