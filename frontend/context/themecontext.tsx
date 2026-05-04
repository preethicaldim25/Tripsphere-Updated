import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    textLight: string;
    primary: string;
    border: string;
    purple: string;
    lightPurple: string;
    error: string;
    success: string;
    warning: string;
  };
}

const lightColors = {
  background: '#F8F6FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  primary: '#6B4EFF',
  border: '#E0D9FF',
  purple: '#6B4EFF',
  lightPurple: '#F3F0FF',
  error: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFB347',
};

const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textLight: '#A0A0A0',
  primary: '#B79CFF',
  border: '#333333',
  purple: '#B79CFF',
  lightPurple: '#2A2A2A',
  error: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFB347',
};

const THEME_STORAGE_KEY = '@tripsphere_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      } else {
        setThemeState(systemColorScheme || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};