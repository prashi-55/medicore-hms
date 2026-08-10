import { api, tokenStorage } from "./api";
import type { AuthUser, Gender, TokenResponse, UserRole } from "../types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/api/auth/register", payload);
    tokenStorage.set(data.access_token, data.refresh_token);
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/api/auth/login", { email, password });
    tokenStorage.set(data.access_token, data.refresh_token);
    return data;
  },

  async logout(): Promise<void> {
    const refresh_token = tokenStorage.getRefresh();
    if (refresh_token) {
      try {
        await api.post("/api/auth/logout", { refresh_token });
      } catch {
        // best-effort; clear local tokens regardless
      }
    }
    tokenStorage.clear();
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/api/auth/forgot-password", { email });
  },

  async resetPassword(token: string, new_password: string): Promise<void> {
    await api.post("/api/auth/reset-password", { token, new_password });
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/api/auth/me");
    return data;
  },
};

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "patient":
      return "/patient/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "receptionist":
      return "/receptionist/dashboard";
    case "admin":
      return "/admin/dashboard";
  }
}
