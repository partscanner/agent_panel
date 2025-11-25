import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { Agent, AuthContextType } from '../types/agent';
import { socketClient } from '../services/socketClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const agentData = await authApi.getMe();
          setAgent(agentData);
          socketClient.connect(token, queryClient);
        } catch (error) {
          console.error('Failed to fetch agent profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, queryClient]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setAgent(response.agent);
    socketClient.connect(response.token, queryClient);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAgent(null);
    socketClient.disconnect();
  };

  return (
    <AuthContext.Provider value={{ agent, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

