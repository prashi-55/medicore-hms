export type UserRole = "patient" | "doctor" | "receptionist" | "admin";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Gender = "male" | "female" | "other";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  full_name: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  doctor_count: number;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string;
  department_name: string | null;
  specialization: string;
  qualification: string | null;
  license_number: string;
  years_of_experience: number;
  consultation_fee: number | null;
  bio: string | null;
  available_days: string | null;
  available_start_time: string | null;
  available_end_time: string | null;
  created_at: string;
}

export interface Receptionist {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employee_code: string;
  desk_location: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string | null;
  created_at: string;
}

export interface PatientSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string;
  doctor_name: string | null;
  department_name: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  reason: string | null;
  diagnosis: string | null;
  notes: string | null;
  has_prescription: boolean;
  created_at: string;
}

export interface PrescriptionItem {
  id?: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string;
  doctor_name: string | null;
  notes: string | null;
  items: PrescriptionItem[];
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  is_emergency_flagged: boolean;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIConversationDetail extends AIConversation {
  messages: AIMessage[];
}

export interface AdminSummary {
  total_patients: number;
  total_doctors: number;
  total_receptionists: number;
  total_departments: number;
  todays_appointments: number;
}

export interface ChartPoint {
  [key: string]: string | number;
}
