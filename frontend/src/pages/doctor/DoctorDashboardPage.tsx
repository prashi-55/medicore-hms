import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { PageHeader, StatCard } from "../../components/ui/Common";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService } from "../../services/domainServices";
import { CalendarDays } from "lucide-react";

export function DoctorDashboardPage() {
  const today = useQuery({ queryKey: ["appointments", "today"], queryFn: () => appointmentService.list({ scope: "today" }) });
  const all = useQuery({ queryKey: ["appointments", "all"], queryFn: () => appointmentService.list() });

  const pendingCount = all.data?.filter((a) => a.status === "pending" || a.status === "confirmed").length ?? 0;
  const completedCount = all.data?.filter((a) => a.status === "completed").length ?? 0;

  return (
    <div>
      <PageHeader title="Doctor dashboard" description="Your schedule and patients at a glance." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's patients" value={today.data?.length ?? 0} icon={Users} />
        <StatCard label="Pending appointments" value={pendingCount} icon={Clock} tone="accent" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Today's appointments</h2>
          <Link to="/doctor/appointments?scope=today" className="text-sm text-primary-600 hover:underline">
            View all <ArrowRight size={12} className="inline" />
          </Link>
        </div>
        {today.isLoading ? (
          <CardSkeleton />
        ) : today.data && today.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {today.data.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink">{appt.patient_name}</p>
                  <p className="text-sm text-ink/60">
                    {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {appt.reason && ` · ${appt.reason}`}
                  </p>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarDays} title="No appointments today" />
        )}
      </section>
    </div>
  );
}
