import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      /* Mock login - replace with actual API call */
      const mockUser = {
        id: '1',
        email,
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1494790108777-385fd4a3b8b4?w=200',
      };

      await AsyncStorage.setItem('jwt_token', 'mock_token');
      await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
      
      setUser(mockUser);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Login failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
      router.replace('/auth/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      /* Mock registration - replace with actual API call */
      const mockUser = {
        id: '1',
        email,
        name,
        avatar: 'https://images.unsplash.com/photo-1494790108777-385fd4a3b8b4?w=200',
      };

      await AsyncStorage.setItem('jwt_token', 'mock_token');
      await AsyncStorage.setItem('user_data', JSON.stringify(mockUser));
      
      setUser(mockUser);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
};