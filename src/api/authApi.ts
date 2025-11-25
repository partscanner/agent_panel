import { apiClient } from './client';
import { LoginRequest, LoginResponse, Agent } from '../types/agent';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<Agent> => {
    const response = await apiClient.get<{ success: boolean; agent: Agent }>('/auth/me');
    return response.data.agent;
  },
};

