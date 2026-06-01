import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified?: boolean;
  location?: string;
  tagline?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  register: (name: string, email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; email?: string; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async (): Promise<void> => {
    try {
      console.log('🔐 AuthContext: Starting to load stored data...');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AsyncStorage timeout')), 5000)
      );

      const dataPromise = (async () => {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        return { storedToken, storedUser };
      })();

      const result = await Promise.race([dataPromise, timeoutPromise]) as { storedToken: string | null, storedUser: string | null };

      if (result.storedToken && result.storedUser) {
        console.log('🔐 AuthContext: Found stored token and user');
        setToken(result.storedToken);
        setUser(JSON.parse(result.storedUser));
      } else {
        console.log('🔐 AuthContext: No stored session found');
      }
    } catch (error) {
      console.error('🔐 AuthContext: Error loading auth data:', error);
    } finally {
      console.log('🔐 AuthContext: Initialization finished, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    try {
      const response = await authAPI.login({ identifier, password });

      await AsyncStorage.setItem('token', response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setToken(response.access_token);
      setUser(response.user);

      return { success: true };
    } catch (error) {
      console.error('Login error in context:', error);
      const msg = error instanceof Error ? error.message : 'Login failed';

      // Detect unverified email (403 from backend)
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('verify your email')) {
        return { success: false, needsVerification: true, error: msg };
      }

      return { success: false, error: msg };
    }
  };

  const register = async (name: string, email: string, password: string, username?: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean; email?: string; message?: string }> => {
    try {
      const response = await authAPI.register({ name, email, password, username });

      // Store the pending email so OTP screen can access it
      await AsyncStorage.setItem('pending_email', email);

      console.log('🔐 AuthContext: Registration success, awaiting OTP verification');

      return {
        success: true,
        needsVerification: true,
        email,
        message: response.user?.message || response.message
      };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const response = await authAPI.verifyOtp(email, otp);

      // OTP verified. According to requirements, we now redirect to login.
      // So we don't store token/user here unless the backend returned it.
      
      await AsyncStorage.removeItem('pending_email');

      console.log('🔐 AuthContext: OTP verified successfully');
      return { success: true, message: response.message };
    } catch (error) {
      console.error('AuthContext: OTP verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  };

  const resendOtp = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const response = await authAPI.resendOtp(email);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('AuthContext: Resend OTP error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('pending_email');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.updateProfile(data);

      const updatedUser = { ...user, ...response } as User;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Update profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        isAuthenticated: !!user,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};