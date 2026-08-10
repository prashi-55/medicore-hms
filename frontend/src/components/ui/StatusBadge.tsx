import type { AppointmentStatus } from "../../types";

const STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-warn/10 text-warn",
  confirmed: "bg-primary-100 text-primary-700",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${STYLES[status]} capitalize`}>{status}</span>;
}
