import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarDays, ClipboardList, Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "../../components/ui/Common";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { appointmentService, prescriptionService } from "../../services/domainServices";
import { useAuth } from "../../context/AuthContext";

export function PatientDashboardPage() {
  const { user } = useAuth();

  const upcoming = useQuery({
    queryKey: ["appointments", "upcoming"],
    queryFn: () => appointmentService.list({ scope: "upcoming" }),
  });
  const history = useQuery({
    queryKey: ["appointments", "history"],
    queryFn: () => appointmentService.list({ scope: "history" }),
  });
  const prescriptions = useQuery({
    queryKey: ["prescriptions", "me"],
    queryFn: () => prescriptionService.myPrescriptions(),
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name.split(" ")[0]}`}
        description="Here's what's happening with your care."
        action={
          <Link to="/patient/doctors" className="btn-primary">
            <CalendarPlus size={16} /> Quick book appointment
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                <CalendarDays size={18} className="text-primary-600" /> Upcoming appointments
              </h2>
              <Link to="/patient/appointments" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            {upcoming.isLoading ? (
              <CardSkeleton />
            ) : upcoming.data && upcoming.data.length > 0 ? (
              <ul className="divide-y divide-line">
                {upcoming.data.slice(0, 4).map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-ink">{appt.doctor_name}</p>
                      <p className="text-sm text-ink/60">
                        {appt.department_name} · {new Date(appt.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Book an appointment with one of our doctors to get started."
                action={
                  <Link to="/patient/doctors" className="btn-primary">
                    Find a doctor
                  </Link>
                }
              />
            )}
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                <ClipboardList size={18} className="text-primary-600" /> Recent prescriptions
              </h2>
              <Link to="/patient/prescriptions" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            {prescriptions.isLoading ? (
              <CardSkeleton />
            ) : prescriptions.data && prescriptions.data.length > 0 ? (
              <ul className="divide-y divide-line">
                {prescriptions.data.slice(0, 3).map((rx) => (
                  <li key={rx.id} className="py-3">
                    <p className="font-medium text-ink">Dr. {rx.doctor_name}</p>
                    <p className="text-sm text-ink/60">
                      {rx.items.length} medicine(s) · {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={ClipboardList} title="No prescriptions yet" />
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Appointment history</h2>
            {history.isLoading ? (
              <CardSkeleton />
            ) : history.data && history.data.length > 0 ? (
              <ul className="divide-y divide-line">
                {history.data.slice(0, 3).map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-ink">{appt.doctor_name}</p>
                      <p className="text-sm text-ink/60">{new Date(appt.scheduled_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarDays} title="No past appointments" />
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Link
            to="/patient/ai-assistant"
            className="card block bg-primary-700 p-6 text-primary-50 transition-colors hover:bg-primary-600"
          >
            <Sparkles size={24} className="text-accent-500" />
            <h3 className="mt-3 font-display text-xl text-white">AI Health Assistant</h3>
            <p className="mt-2 text-sm text-primary-100/80">
              Ask about symptoms, get general guidance, or have your prescription explained in plain language.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-500">
              Start a conversation <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
