import { Platform } from 'react-native';

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const calculateAverageRating = (reviews: Array<{ rating: number }>): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
};

export const groupByCategory = <T extends { category: string }>(
  items: T[]
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/** Fixed debounce function */
/* In utils/helpers.ts, update the debounce function: */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, waitFor);
  };
};

/* Promise-based debounce if needed */
export const debounceAsync = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve) => {
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
};

export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }
  // Physical devices must use the host computer's IPv4 network address
  return 'http://192.168.1.155:8000/api';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#B980F0', '#FFE194',
    '#FF9999', '#6C5B7B', '#F08A5D', '#B83B5E', '#2C3E50', '#E67E22',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};