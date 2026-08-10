import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { departmentService } from "../../services/domainServices";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";
import type { Department } from "../../types";

interface FormValues {
  name: string;
  description: string;
}

export function AdminDepartmentsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["departments"], queryFn: departmentService.list });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["departments"] });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? departmentService.update(editing.id, values) : departmentService.create(values),
    onSuccess: () => {
      invalidate();
      showToast(editing ? "Department updated." : "Department created.");
      closeDialog();
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.remove(id),
    onSuccess: () => {
      invalidate();
      showToast("Department deleted.");
      setDeleteTarget(null);
    },
    onError: (err) => showToast(getErrorMessage(err), "error"),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    reset({ name: dept.name, description: dept.description ?? "" });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage hospital departments."
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New department
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
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Doctors</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-5 py-3 font-medium text-ink">{dept.name}</td>
                  <td className="px-5 py-3 text-ink/70">{dept.description || "—"}</td>
                  <td className="px-5 py-3 text-ink/70">{dept.doctor_count}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button className="text-ink/50 hover:text-primary-600" onClick={() => openEdit(dept)}>
                        <Pencil size={15} />
                      </button>
                      <button className="text-ink/50 hover:text-danger" onClick={() => setDeleteTarget(dept)}>
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
            <EmptyState icon={Building2} title="No departments yet" />
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? "Edit department" : "New department"}>
        <form className="space-y-4" onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
          <div>
            <label className="label">Name</label>
            <input className="input" {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" {...register("description")} />
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
        title="Delete department"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
