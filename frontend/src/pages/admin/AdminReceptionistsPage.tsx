import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Users, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { receptionistService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Receptionist } from "../../types";

interface FormValues {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  employee_code: string;
  desk_location: string;
}

export function AdminReceptionistsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["receptionists"], queryFn: receptionistService.list });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Receptionist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Receptionist | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["receptionists"] });

  const [showPassword, setShowPassword] = useState(false);
  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (editing) {
        const { email, password, employee_code, ...updatable } = values;
        return receptionistService.update(editing.id, updatable);
      }
      return receptionistService.create(values as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      invalidate();
      showToast(editing ? "Receptionist updated." : "Receptionist created.");
      closeDialog();
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => receptionistService.remove(id),
    onSuccess: () => {
      invalidate();
      showToast("Receptionist removed.");
      setDeleteTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ email: "", password: "", full_name: "", phone: "", employee_code: "", desk_location: "" });
    setDialogOpen(true);
  };

  const openEdit = (r: Receptionist) => {
    setEditing(r);
    reset({
      email: r.email,
      password: "",
      full_name: r.full_name,
      phone: r.phone ?? "",
      employee_code: r.employee_code,
      desk_location: r.desk_location ?? "",
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
        title="Receptionists"
        description="Manage front-desk staff accounts."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New receptionist
          </button>
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
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Employee code</th>
                <th className="px-5 py-3">Desk</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-ink">{r.full_name}</td>
                  <td className="px-5 py-3 text-ink/70">{r.employee_code}</td>
                  <td className="px-5 py-3 text-ink/70">{r.desk_location || "—"}</td>
                  <td className="px-5 py-3 text-ink/70">{r.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button className="text-ink/50 hover:text-primary-600" onClick={() => openEdit(r)}>
                        <Pencil size={15} />
                      </button>
                      <button className="text-ink/50 hover:text-danger" onClick={() => setDeleteTarget(r)}>
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
            <EmptyState icon={Users} title="No receptionists yet" />
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? "Edit receptionist" : "New receptionist"}>
        <form className="space-y-4" onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
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
          {!editing && (
            <>
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
              <div>
                <label className="label">Employee code</label>
                <input className="input" {...register("employee_code", { required: "Required" })} />
                {errors.employee_code && <p className="mt-1 text-xs text-danger">{errors.employee_code.message}</p>}
              </div>
            </>
          )}
          <div>
            <label className="label">Desk location</label>
            <input className="input" {...register("desk_location")} />
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
        title="Remove receptionist"
        description={`Remove ${deleteTarget?.full_name}? This will delete their account and cannot be undone.`}
        confirmLabel="Remove"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
