import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { patientService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Patient } from "../../types";

type FormValues = Pick<
  Patient,
  | "full_name"
  | "phone"
  | "date_of_birth"
  | "gender"
  | "address"
  | "blood_group"
  | "emergency_contact_name"
  | "emergency_contact_phone"
  | "allergies"
>;

export function PatientProfilePage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["patients", "me"], queryFn: patientService.me });
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => patientService.updateMe(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "me"] });
      showToast("Profile updated.");
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="My profile" />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My profile" description="Keep your personal and medical details up to date." />

      <form className="card max-w-2xl space-y-5 p-6" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register("full_name")} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit phone number"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Phone number must be exactly 10 digits",
                },
              })}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
              }}
            />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" {...register("date_of_birth")} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" {...register("gender")}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Blood group</label>
            <input className="input" placeholder="e.g. O+" {...register("blood_group")} />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input min-h-[70px]" {...register("address")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Emergency contact name</label>
            <input className="input" {...register("emergency_contact_name")} />
          </div>
          <div>
            <label className="label">Emergency contact phone</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input"
                placeholder="10-digit phone number"
                {...register("emergency_contact_phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be exactly 10 digits",
                  },
                })}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                }}
              />
          </div>
        </div>

        <div>
          <label className="label">Allergies</label>
          <textarea className="input min-h-[70px]" placeholder="e.g. Penicillin, peanuts" {...register("allergies")} />
        </div>

        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          <Save size={16} />
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
