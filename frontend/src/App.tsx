import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppShell } from "./layouts/AppShell";
import { roleHomePath } from "./services/authService";

import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

import { PatientDashboardPage } from "./pages/patient/PatientDashboardPage";
import { DoctorSearchPage } from "./pages/patient/DoctorSearchPage";
import { PatientAppointmentsPage } from "./pages/patient/PatientAppointmentsPage";
import { PatientPrescriptionsPage } from "./pages/patient/PatientPrescriptionsPage";
import { AIAssistantPage } from "./pages/patient/AIAssistantPage";
import { PatientProfilePage } from "./pages/patient/PatientProfilePage";

import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage";
import { DoctorAppointmentsPage } from "./pages/doctor/DoctorAppointmentsPage";

import { ReceptionistDashboardPage } from "./pages/receptionist/ReceptionistDashboardPage";
import { ReceptionistAppointmentsPage } from "./pages/receptionist/ReceptionistAppointmentsPage";
import { ReceptionistPatientsPage } from "./pages/receptionist/ReceptionistPatientsPage";
import { ReceptionistDoctorsPage } from "./pages/receptionist/ReceptionistDoctorsPage";

import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminDoctorsPage } from "./pages/admin/AdminDoctorsPage";
import { AdminReceptionistsPage } from "./pages/admin/AdminReceptionistsPage";
import { AdminDepartmentsPage } from "./pages/admin/AdminDepartmentsPage";
import { AdminAppointmentsPage } from "./pages/admin/AdminAppointmentsPage";

import { NotFoundPage } from "./pages/NotFoundPage";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={user ? roleHomePath(user.role) : "/login"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
              <Route path="/patient/doctors" element={<DoctorSearchPage />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/prescriptions" element={<PatientPrescriptionsPage />} />
              <Route path="/patient/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/patient/profile" element={<PatientProfilePage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
              <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["receptionist"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/receptionist/dashboard" element={<ReceptionistDashboardPage />} />
              <Route path="/receptionist/appointments" element={<ReceptionistAppointmentsPage />} />
              <Route path="/receptionist/patients" element={<ReceptionistPatientsPage />} />
              <Route path="/receptionist/doctors" element={<ReceptionistDoctorsPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
              <Route path="/admin/receptionists" element={<AdminReceptionistsPage />} />
              <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
              <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
