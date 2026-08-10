import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardList, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog } from "../../components/ui/Dialog";
import { prescriptionService, aiService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import { MiniMarkdown } from "../../components/ai/MiniMarkdown";

export function PatientPrescriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["prescriptions", "me"],
    queryFn: () => prescriptionService.myPrescriptions(),
  });
  const { showToast } = useToast();
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanation, setExplanation] = useState("");

  const explainMutation = useMutation({
    mutationFn: (prescriptionId: string) => aiService.explainPrescription(prescriptionId),
    onSuccess: (res) => {
      setExplanation(res.reply);
      setExplainOpen(true);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  return (
    <div>
      <PageHeader title="My prescriptions" description="Medicines prescribed by your doctors." />

      {isLoading ? (
        <TableSkeleton />
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((rx) => (
            <div key={rx.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">Dr. {rx.doctor_name}</p>
                  <p className="text-xs text-ink/50">{new Date(rx.created_at).toLocaleString()}</p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => explainMutation.mutate(rx.id)}
                  disabled={explainMutation.isPending}
                >
                  <Sparkles size={15} />
                  {explainMutation.isPending ? "Explaining…" : "Explain in plain language"}
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="py-1.5 pr-4">Medicine</th>
                    <th className="py-1.5 pr-4">Dosage</th>
                    <th className="py-1.5 pr-4">Frequency</th>
                    <th className="py-1.5 pr-4">Duration</th>
                    <th className="py-1.5">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rx.items.map((item, idx) => (
                    <tr key={item.id ?? idx}>
                      <td className="py-2 pr-4 font-medium text-ink">{item.medicine_name}</td>
                      <td className="py-2 pr-4 text-ink/70">{item.dosage}</td>
                      <td className="py-2 pr-4 text-ink/70">{item.frequency}</td>
                      <td className="py-2 pr-4 text-ink/70">{item.duration_days} days</td>
                      <td className="py-2 text-ink/70">{item.instructions || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rx.notes && <p className="mt-3 text-sm text-ink/60">Doctor's notes: {rx.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No prescriptions yet" description="Prescriptions from your doctors will appear here." />
      )}

      <Dialog open={explainOpen} onClose={() => setExplainOpen(false)} title="Your prescription, explained">
        <div className="prose prose-sm max-w-none text-ink/80">
          <MiniMarkdown content={explanation} />
        </div>
      </Dialog>
    </div>
  );
}
