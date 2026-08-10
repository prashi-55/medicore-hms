import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Users, Stethoscope } from "lucide-react";
import { PageHeader, StatCard } from "../../components/ui/Common";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService, doctorService } from "../../services/domainServices";
import { CalendarDays } from "lucide-react";

export function ReceptionistDashboardPage() {
  const today = useQuery({ queryKey: ["appointments", "today"], queryFn: () => appointmentService.list({ scope: "today" }) });
  const doctors = useQuery({ queryKey: ["doctors"], queryFn: () => doctorService.search() });

  const waitingCount = today.data?.filter((a) => a.status === "pending" || a.status === "confirmed").length ?? 0;

  return (
    <div>
      <PageHeader title="Reception desk" description="Today's bookings and doctor availability." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's bookings" value={today.data?.length ?? 0} icon={CalendarCheck} />
        <StatCard label="Waiting patients" value={waitingCount} icon={Users} tone="accent" />
        <StatCard label="Available doctors" value={doctors.data?.length ?? 0} icon={Stethoscope} />
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg text-ink">Today's bookings</h2>
        {today.isLoading ? (
          <CardSkeleton />
        ) : today.data && today.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {today.data.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink">
                    {appt.patient_name} → {appt.doctor_name}
                  </p>
                  <p className="text-sm text-ink/60">{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarDays} title="No bookings today" />
        )}
      </section>
    </div>
  );
}
