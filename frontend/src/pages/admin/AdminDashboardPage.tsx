import { useQuery } from "@tanstack/react-query";
import { Users, Stethoscope, UserCog, Building2, CalendarDays } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeader, StatCard } from "../../components/ui/Common";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { adminService } from "../../services/domainServices";

const PIE_COLORS = ["#B8862B", "#1E7A70", "#1E7A4C", "#B3382C"];

export function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ["admin", "summary"], queryFn: adminService.summary });
  const patientsPerMonth = useQuery({ queryKey: ["admin", "patients-per-month"], queryFn: adminService.patientsPerMonth });
  const appointmentsPerMonth = useQuery({
    queryKey: ["admin", "appointments-per-month"],
    queryFn: adminService.appointmentsPerMonth,
  });
  const doctorsPerDept = useQuery({ queryKey: ["admin", "doctors-per-department"], queryFn: adminService.doctorsPerDepartment });
  const statusBreakdown = useQuery({
    queryKey: ["admin", "status-breakdown"],
    queryFn: adminService.appointmentStatusBreakdown,
  });

  return (
    <div>
      <PageHeader title="Admin dashboard" description="System-wide analytics and activity." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total patients" value={summary.data?.total_patients ?? "—"} icon={Users} />
        <StatCard label="Total doctors" value={summary.data?.total_doctors ?? "—"} icon={Stethoscope} />
        <StatCard label="Total receptionists" value={summary.data?.total_receptionists ?? "—"} icon={UserCog} />
        <StatCard label="Today's appointments" value={summary.data?.todays_appointments ?? "—"} icon={CalendarDays} tone="accent" />
        <StatCard label="Departments" value={summary.data?.total_departments ?? "—"} icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Patients per month</h2>
          {patientsPerMonth.isLoading ? (
            <CardSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={patientsPerMonth.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1DDD3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0E4F49" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Appointments per month</h2>
          {appointmentsPerMonth.isLoading ? (
            <CardSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={appointmentsPerMonth.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1DDD3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#C97A2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Doctors per department</h2>
          {doctorsPerDept.isLoading ? (
            <CardSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={doctorsPerDept.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E1DDD3" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="department" type="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E7A70" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Appointment status breakdown</h2>
          {statusBreakdown.isLoading ? (
            <CardSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusBreakdown.data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                  {statusBreakdown.data?.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
