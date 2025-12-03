export interface Agent {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  agent: Agent;
}

export interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface AgentsResponse {
  success: boolean;
  items: Agent[];
}

