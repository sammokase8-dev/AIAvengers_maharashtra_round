import apiClient from '../api/client';
import { AuthSession, User } from '../types';

export interface LoginDto {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password?: string;
  channelName?: string;
  niche?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword?: string;
}

export const authApi = {
  async login(payload: LoginDto): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/login', payload);
    if (response?.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  async register(payload: RegisterDto): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/register', payload);
    if (response?.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async forgotPassword(payload: ForgotPasswordDto): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', payload);
  },

  async resetPassword(payload: ResetPasswordDto): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', payload);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.removeToken();
    }
  },
};
export default authApi;
