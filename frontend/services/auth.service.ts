import { authAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  /* Register new user */
  register: async (name: string, email: string, password: string): Promise<LoginResponse | null> => {
    try {
      console.log('AuthService: Registering user:', { name, email });
      
      const response = await authAPI.register({ name, email, password });
      
      console.log('AuthService: Registration response:', response);
      
      if (response && response.access_token) {
        // Store token and user data
        await AsyncStorage.setItem('jwt_token', response.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        await AsyncStorage.setItem('token', response.access_token); // For compatibility with existing code
        await AsyncStorage.setItem('user', JSON.stringify(response.user)); // For compatibility
        
        return response;
      }
      
      return null;
    } catch (error: any) {
      console.error('AuthService: Registration error:', error.message);
      return null;
    }
  },

  /* Login user */
  login: async (email: string, password: string): Promise<LoginResponse | null> => {
    try {
      console.log('AuthService: Logging in user:', { email });
      
      const response = await authAPI.login({ email, password });
      
      console.log('AuthService: Login response:', response);
      
      if (response && response.access_token) {
        // Store token and user data
        await AsyncStorage.setItem('jwt_token', response.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        await AsyncStorage.setItem('token', response.access_token); // For compatibility with existing code
        await AsyncStorage.setItem('user', JSON.stringify(response.user)); // For compatibility
        
        return response;
      }
      
      return null;
    } catch (error: any) {
      console.error('AuthService: Login error:', error.message);
      return null;
    }
  },

  /* Logout user */
  logout: async (): Promise<void> => {
    try {
      console.log('AuthService: Logging out user');
      
      // Remove all auth-related items from storage
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      console.log('AuthService: Logout successful');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    }
  },

  /* Get current user from storage */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const userDataCompat = await AsyncStorage.getItem('user'); // For compatibility
      
      if (userData) {
        return JSON.parse(userData);
      } else if (userDataCompat) {
        return JSON.parse(userDataCompat);
      }
      
      return null;
    } catch (error) {
      console.error('AuthService: Error getting user:', error);
      return null;
    }
  },

  /* Check if user is authenticated */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const tokenCompat = await AsyncStorage.getItem('token'); // For compatibility
      
      return !!(token || tokenCompat);
    } catch (error) {
      console.error('AuthService: Error checking auth:', error);
      return false;
    }
  },

  /* Get auth token */
  getToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const tokenCompat = await AsyncStorage.getItem('token'); // For compatibility
      
      return token || tokenCompat;
    } catch (error) {
      console.error('AuthService: Error getting token:', error);
      return null;
    }
  },

  /* Update user data in storage */
  updateUserData: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      await AsyncStorage.setItem('user', JSON.stringify(user)); // For compatibility
      
      console.log('AuthService: User data updated');
    } catch (error) {
      console.error('AuthService: Error updating user:', error);
    }
  },

  /* Clear all auth data */
  clearAuthData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      console.log('AuthService: All auth data cleared');
    } catch (error) {
      console.error('AuthService: Error clearing auth data:', error);
    }
  }
};

// Also export as default for flexibility
export default authService;