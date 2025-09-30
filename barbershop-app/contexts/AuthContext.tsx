import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, email?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@barbershop_token';
const USER_KEY = '@barbershop_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Set up axios interceptor when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY)
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuth = async (authToken: string, userData: User) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, authToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData))
      ]);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth:', error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY)
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      await storeAuth(authToken, userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      const { token: authToken, user: userData } = response.data;
      await storeAuth(authToken, userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const updateProfile = async (name?: string, email?: string) => {
    try {
      const response = await api.put('/auth/profile', { name, email });
      const { user: updatedUser } = response.data;
      setUser(updatedUser);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Password change failed';
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
