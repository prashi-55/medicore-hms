import { api } from "./api";
import type {
  AdminSummary,
  AIConversation,
  AIConversationDetail,
  Appointment,
  AppointmentStatus,
  ChartPoint,
  Department,
  Doctor,
  Patient,
  PatientSummary,
  Prescription,
  PrescriptionItem,
  Receptionist,
} from "../types";

export const departmentService = {
  list: async () => (await api.get<Department[]>("/api/departments")).data,
  create: async (payload: { name: string; description?: string }) =>
    (await api.post<Department>("/api/departments", payload)).data,
  update: async (id: string, payload: Partial<{ name: string; description: string }>) =>
    (await api.put<Department>(`/api/departments/${id}`, payload)).data,
  remove: async (id: string) => api.delete(`/api/departments/${id}`),
};

export const doctorService = {
  search: async (params: { q?: string; department_id?: string } = {}) =>
    (await api.get<Doctor[]>("/api/doctors", { params })).data,
  get: async (id: string) => (await api.get<Doctor>(`/api/doctors/${id}`)).data,
  create: async (payload: Record<string, unknown>) => (await api.post<Doctor>("/api/doctors", payload)).data,
  update: async (id: string, payload: Record<string, unknown>) =>
    (await api.put<Doctor>(`/api/doctors/${id}`, payload)).data,
  remove: async (id: string) => api.delete(`/api/doctors/${id}`),
};

export const receptionistService = {
  list: async () => (await api.get<Receptionist[]>("/api/receptionists")).data,
  create: async (payload: Record<string, unknown>) =>
    (await api.post<Receptionist>("/api/receptionists", payload)).data,
  update: async (id: string, payload: Record<string, unknown>) =>
    (await api.put<Receptionist>(`/api/receptionists/${id}`, payload)).data,
  remove: async (id: string) => api.delete(`/api/receptionists/${id}`),
};

export const patientService = {
  me: async () => (await api.get<Patient>("/api/patients/me")).data,
  updateMe: async (payload: Partial<Patient>) => (await api.put<Patient>("/api/patients/me", payload)).data,
  search: async (q?: string) => (await api.get<PatientSummary[]>("/api/patients", { params: { q } })).data,
  get: async (id: string) => (await api.get<Patient>(`/api/patients/${id}`)).data,
  /** Receptionist registers a new patient. Uses the public register endpoint directly so it
   *  does not disturb the receptionist's own stored auth tokens. */
  registerNew: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => {
    const { data } = await api.post("/api/auth/register", payload);
    return data;
  },
};

export const appointmentService = {
  list: async (params: { scope?: string; status?: AppointmentStatus } = {}) =>
    (await api.get<Appointment[]>("/api/appointments", { params })).data,
  get: async (id: string) => (await api.get<Appointment>(`/api/appointments/${id}`)).data,
  book: async (payload: { doctor_id: string; scheduled_at: string; reason?: string; patient_id?: string }) =>
    (await api.post<Appointment>("/api/appointments", payload)).data,
  cancel: async (id: string) => (await api.post<Appointment>(`/api/appointments/${id}/cancel`)).data,
  reschedule: async (id: string, scheduled_at: string) =>
    (await api.put<Appointment>(`/api/appointments/${id}/reschedule`, { scheduled_at })).data,
  updateStatus: async (id: string, status: AppointmentStatus) =>
    (await api.put<Appointment>(`/api/appointments/${id}/status`, { status })).data,
  addDiagnosis: async (id: string, diagnosis: string, notes?: string) =>
    (await api.put<Appointment>(`/api/appointments/${id}/diagnosis`, { diagnosis, notes })).data,
};

export const prescriptionService = {
  create: async (payload: { appointment_id: string; notes?: string; items: PrescriptionItem[] }) =>
    (await api.post<Prescription>("/api/prescriptions", payload)).data,
  update: async (id: string, payload: { notes?: string; items?: PrescriptionItem[] }) =>
    (await api.put<Prescription>(`/api/prescriptions/${id}`, payload)).data,
  myPrescriptions: async () => (await api.get<Prescription[]>("/api/prescriptions/me")).data,
  get: async (id: string) => (await api.get<Prescription>(`/api/prescriptions/${id}`)).data,
};

export const aiService = {
  suggestedQuestions: async () => (await api.get<{ questions: string[] }>("/api/ai/suggested-questions")).data.questions,
  listConversations: async () => (await api.get<AIConversation[]>("/api/ai/conversations")).data,
  getConversation: async (id: string) => (await api.get<AIConversationDetail>(`/api/ai/conversations/${id}`)).data,
  deleteConversation: async (id: string) => api.delete(`/api/ai/conversations/${id}`),
  chat: async (message: string, conversation_id?: string) =>
    (await api.post("/api/ai/chat", { message, conversation_id })).data as {
      conversation_id: string;
      reply: string;
      is_emergency: boolean;
      disclaimer: string;
    },
  explainPrescription: async (prescription_id: string) =>
    (await api.post("/api/ai/explain-prescription", { prescription_id })).data as {
      conversation_id: string;
      reply: string;
    },
};

export const adminService = {
  summary: async () => (await api.get<AdminSummary>("/api/admin/dashboard/summary")).data,
  patientsPerMonth: async () => (await api.get<ChartPoint[]>("/api/admin/dashboard/charts/patients-per-month")).data,
  appointmentsPerMonth: async () =>
    (await api.get<ChartPoint[]>("/api/admin/dashboard/charts/appointments-per-month")).data,
  doctorsPerDepartment: async () =>
    (await api.get<ChartPoint[]>("/api/admin/dashboard/charts/doctors-per-department")).data,
  appointmentStatusBreakdown: async () =>
    (await api.get<ChartPoint[]>("/api/admin/dashboard/charts/appointment-status-breakdown")).data,
};
