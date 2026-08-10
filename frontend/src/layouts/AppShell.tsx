import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  History,
  Stethoscope,
  Users,
  Building2,
  ClipboardList,
  Sparkles,
  UserCog,
  Menu,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Dashboard", to: "/patient/dashboard", icon: LayoutDashboard },
    { label: "Find a Doctor", to: "/patient/doctors", icon: Stethoscope },
    { label: "Appointments", to: "/patient/appointments", icon: CalendarDays },
    { label: "Prescriptions", to: "/patient/prescriptions", icon: ClipboardList },
    { label: "AI Health Assistant", to: "/patient/ai-assistant", icon: Sparkles },
    { label: "Profile", to: "/patient/profile", icon: UserCog },
  ],
  doctor: [
    { label: "Dashboard", to: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Today's Appointments", to: "/doctor/appointments?scope=today", icon: CalendarDays },
    { label: "All Appointments", to: "/doctor/appointments", icon: History },
  ],
  receptionist: [
    { label: "Dashboard", to: "/receptionist/dashboard", icon: LayoutDashboard },
    { label: "Appointments", to: "/receptionist/appointments", icon: CalendarDays },
    { label: "Patients", to: "/receptionist/patients", icon: Users },
    { label: "Doctors", to: "/receptionist/doctors", icon: Stethoscope },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Doctors", to: "/admin/doctors", icon: Stethoscope },
    { label: "Receptionists", to: "/admin/receptionists", icon: Users },
    { label: "Departments", to: "/admin/departments", icon: Building2 },
    { label: "Appointments", to: "/admin/appointments", icon: CalendarDays },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  receptionist: "Receptionist",
  admin: "Administrator",
};

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const navItems = NAV_BY_ROLE[user.role];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 border-r border-line bg-panel transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 font-display text-white">
              M
            </div>
            <span className="font-display text-lg text-ink">MediCore</span>
          </div>
          <button className="lg:hidden text-ink/50" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={!item.to.includes("?")}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-ink/60 hover:bg-surface hover:text-ink"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-panel/90 px-4 backdrop-blur sm:px-6">
          <button className="text-ink/60 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-sm text-ink/50">{ROLE_LABEL[user.role]} Portal</div>

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-ink">{user.full_name}</span>
              <ChevronDown size={14} className="text-ink/40" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 card p-1">
                  <div className="px-3 py-2 text-xs text-ink/50">{user.email}</div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/5"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
