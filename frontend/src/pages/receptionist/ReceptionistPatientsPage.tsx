import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Users, UserPlus, Eye,EyeOff } from "lucide-react";
import { PageHeader, SearchInput } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog } from "../../components/ui/Dialog";
import { patientService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";

interface RegisterForm {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export function ReceptionistPatientsPage() {
  const [q, setQ] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["patients", "search", q],
    queryFn: () => patientService.search(q || undefined),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

  const registerMutation = useMutation({
    mutationFn: (values: RegisterForm) => patientService.registerNew(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      showToast("Patient registered.");
      setRegisterOpen(false);
      reset();
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search existing patients or register a new one."
        action={
          <button className="btn-primary" onClick={() => setRegisterOpen(true)}>
            <UserPlus size={16} /> Register patient
          </button>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, email, or phone…" />
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
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium text-ink">{p.full_name}</td>
                  <td className="px-5 py-3 text-ink/70">{p.email}</td>
                  <td className="px-5 py-3 text-ink/70">{p.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState icon={Users} title="No patients found" />
          </div>
        )}
      </div>

      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register new patient">
        <form className="space-y-4" onSubmit={handleSubmit((v) => registerMutation.mutate(v))}>
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register("full_name", { required: "Required" })} />
            {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register("email", { required: "Required" })} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
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
            <label className="label">Temporary password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input w-full pr-10"
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Register patient"}
          </button>
        </form>
      </Dialog>
    </div>
  );
}
