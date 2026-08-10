import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Stethoscope, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { PageHeader, SearchInput } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { departmentService, doctorService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Doctor } from "../../types";

interface FormValues {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  department_id: string;
  specialization: string;
  qualification: string;
  license_number: string;
  years_of_experience: number;
  consultation_fee: number;
  available_days: string;
  available_start_time: string;
  available_end_time: string;
}

export function AdminDoctorsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["doctors", q], queryFn: () => doctorService.search({ q: q || undefined }) });
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentService.list });

  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["doctors"] });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (editing) {
        const { email, password, license_number, ...updatable } = values;
        return doctorService.update(editing.id, updatable);
      }
      return doctorService.create(values as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      invalidate();
      showToast(editing ? "Doctor updated." : "Doctor created.");
      closeDialog();
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorService.remove(id),
    onSuccess: () => {
      invalidate();
      showToast("Doctor removed.");
      setDeleteTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const openCreate = () => {
    setEditing(null);
    reset({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      department_id: "",
      specialization: "",
      qualification: "",
      license_number: "",
      years_of_experience: 0,
      consultation_fee: 0,
      available_days: "",
      available_start_time: "",
      available_end_time: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    reset({
      email: doc.email,
      password: "",
      full_name: doc.full_name,
      phone: doc.phone ?? "",
      department_id: doc.department_id,
      specialization: doc.specialization,
      qualification: doc.qualification ?? "",
      license_number: doc.license_number,
      years_of_experience: doc.years_of_experience,
      consultation_fee: doc.consultation_fee ?? 0,
      available_days: doc.available_days ?? "",
      available_start_time: doc.available_start_time ?? "",
      available_end_time: doc.available_end_time ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Manage doctor accounts and profiles."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New doctor
          </button>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name or specialization…" />
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
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">License</th>
                <th className="px-5 py-3">Experience</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-5 py-3 font-medium text-ink">{doc.full_name}</td>
                  <td className="px-5 py-3 text-ink/70">{doc.department_name}</td>
                  <td className="px-5 py-3 text-ink/70">{doc.license_number}</td>
                  <td className="px-5 py-3 text-ink/70">{doc.years_of_experience} yrs</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button className="text-ink/50 hover:text-primary-600" onClick={() => openEdit(doc)}>
                        <Pencil size={15} />
                      </button>
                      <button className="text-ink/50 hover:text-danger" onClick={() => setDeleteTarget(doc)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState icon={Stethoscope} title="No doctors found" />
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? "Edit doctor" : "New doctor"} maxWidth="max-w-xl">
        <form className="space-y-4" onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" {...register("full_name", { required: "Required" })} />
              {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input"
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
          </div>

          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" {...register("email", { required: "Required" })} />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
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
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select className="input" {...register("department_id", { required: "Required" })}>
                <option value="">Select…</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.department_id && <p className="mt-1 text-xs text-danger">{errors.department_id.message}</p>}
            </div>
            <div>
              <label className="label">Specialization</label>
              <input className="input" {...register("specialization", { required: "Required" })} />
              {errors.specialization && <p className="mt-1 text-xs text-danger">{errors.specialization.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Qualification</label>
              <input className="input" {...register("qualification")} />
            </div>
            {!editing && (
              <div>
                <label className="label">License number</label>
                <input className="input" {...register("license_number", { required: "Required" })} />
                {errors.license_number && <p className="mt-1 text-xs text-danger">{errors.license_number.message}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Years of experience</label>
              <input type="number" min={0} className="input" {...register("years_of_experience", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Consultation fee ($)</label>
              <input type="number" min={0} step="0.01" className="input" {...register("consultation_fee", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Available days</label>
              <input className="input" placeholder="Mon,Tue,Wed" {...register("available_days")} />
            </div>
            <div>
              <label className="label">Start time</label>
              <input type="time" className="input" {...register("available_start_time")} />
            </div>
            <div>
              <label className="label">End time</label>
              <input type="time" className="input" {...register("available_end_time")} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Remove doctor"
        description={`Remove ${deleteTarget?.full_name}? This will delete their account and cannot be undone.`}
        confirmLabel="Remove"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
