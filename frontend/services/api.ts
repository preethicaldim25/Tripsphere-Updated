import { API_URL } from '../get_urls';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* Types */
export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  location?: string;
  tagline?: string;
  profile_image?: string;
  message?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OTPVerifyResponse {
  message: string;
  access_token?: string;
  token_type?: string;
  user: User;
}

export interface LoginCredentials {
  identifier: string; // Email or Username
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  username?: string;
}

export interface Destination {
  _id?: string;
  id?: string;
  carousel_images?: string[];
  name: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  location: string;
  district: string;
  state?: string;
  country?: string;
  category: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  bestTime?: string;
  entryFee?: string;
  timeRequired?: string;
  coordinates?: { lat: number; lng: number };
  highlights?: Array<{ name: string; icon: string; description: string }>;
  nearby?: Array<{ name: string; distance: string; time: string; type?: string }>;
  weather?: {
    summer: string;
    winter: string;
    monsoon: string;
    current: string;
    condition: string;
  };
  cuisine?: string[];
  tips?: string[];
  is_featured?: boolean;
  is_hidden_gem?: boolean;
  speciality_tags?: string[];
  ai_recommendations?: {
    best_time: string;
    crowd_tips: string;
    hidden_tip: string;
  };
  attractions?: Array<{ name: string; lat: number; lng: number; type: string; image?: string }>;
  food?: Array<{ name: string; cuisine: string; rating: number; image?: string }>;
  nearby_places?: Array<{ name: string; distance: string }>;
  estimated_budget?: number;
  avg_cost_per_person?: number;
  crowd_level?: string;
  is_exact_match?: boolean;
  real_time_duration?: string;
  distance_km?: number;
  ai_score?: number;
  smart_tags?: string[];
}

export interface Trip {
  id: string;
  _id?: string;
  user_id: string;
  name: string;
  destination_id: string;
  destination_details?: Destination;
  start_location?: string;
  stops?: string[];
  stop_details?: Destination[];
  start_date: string;
  end_date: string;
  budget: number;
  used_budget?: number;
  budget_breakdown?: { [key: string]: number };
  travelers: number;
  accommodation?: string;
  notes?: string;
  status?: 'draft' | 'upcoming' | 'completed';
  is_confirmed?: boolean;
  is_draft?: boolean;
  transport_preferences?: string;
  itinerary?: DayItinerary[];
  created_at: string;
  updated_at: string;
}

export interface TripCreate {
  title: string;
  destination_name: string;
  location: string;
  destination_id?: string;
  destination_image?: string;
  start_location?: string;
  stops?: string[];
  start_date: string;
  end_date: string;
  total_budget: number;
  budget_breakdown?: { [key: string]: number };
  travelers: number;
  accommodation?: string;
  notes?: string;
  status?: string;
  is_confirmed?: boolean;
  is_draft?: boolean;
  transport_preferences?: string;
  itinerary?: DayItinerary[];
}

export interface Expense {
  _id: string;
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface ExpenseCreate {
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}


const getToken = async (): Promise<string | null> => {
  try {
    // Check multiple possible storage keys
    const token = await AsyncStorage.getItem('token');
    const jwtToken = await AsyncStorage.getItem('jwt_token');

    const validToken = token || jwtToken;
    console.log('Retrieved token:', validToken ? 'Yes' : 'No');

    return validToken;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}
// Consolidated into the main Trip interface above

export interface DayItinerary {
  day: number;
  date: string;
  activities: Activity[];
}

export type Category = 'food' | 'sightseeing' | 'travel' | 'accommodation' | 'other';

export interface Activity {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  cost?: number;
  category: Category;
  completed?: boolean;
}

export interface Expense {
  _id: string;
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

// Add itinerary API methods
export const itineraryAPI = {
  getByTrip: (tripId: string): Promise<DayItinerary[]> =>
    apiClient<DayItinerary[]>(`/trips/${tripId}/itinerary`),

  updateItinerary: (tripId: string, itinerary: DayItinerary[]) =>
    apiClient(`/trips/${tripId}/itinerary`, {
      method: 'POST',
      body: JSON.stringify(itinerary),
    }),

  addActivity: (tripId: string, day: number, activity: Omit<Activity, 'id'>) =>
    apiClient(`/trips/${tripId}/itinerary/day/${day}`, {
      method: 'POST',
      body: JSON.stringify(activity),
    }),
};



const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = 'Something went wrong';
    try {
      const error = await response.json();
      if (Array.isArray(error.detail)) {
        errorMessage = error.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
      } else {
        errorMessage = error.detail || error.message || errorMessage;
      }
    } catch (e) {
      if (response.status === 404) {
        errorMessage = 'Check your API_URL (404 Not Found)';
      } else if (response.status >= 500) {
        errorMessage = 'Server is crashing (500)';
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Offline'}`;
      }
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log('401 Unauthorized - clearing tokens');
      // Clear tokens but DON'T throw session expired for login requests
      const isLoginRequest = response.url.includes('/auth/login');

      if (!isLoginRequest) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('user_data');
        throw new Error('Session expired. Please login again.');
      }
    }

    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
};
const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // ✅ Guard: Block any call with undefined in path
  if (!endpoint || endpoint.includes('/undefined') || endpoint.includes('undefined/')) {
    console.warn(`🚫 BLOCKED API CALL - Invalid endpoint: ${endpoint}`);
    return Promise.reject(new Error('Invalid API endpoint (undefined ID)'));
  }

  // ✅ Defensive check for API_URL
  const baseUrl = API_URL || '';
  
  // ✅ Robust URL construction
  const safeBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${safeBaseUrl}${safeEndpoint}`;
  
  const token = await getToken();

  // ✅ Production Safety: Detect if we are in a development or ngrok environment
  const isDevelopmentOrNgrok = 
    (typeof __DEV__ !== 'undefined' && __DEV__) || 
    safeBaseUrl.includes('ngrok') || 
    safeBaseUrl.includes('localhost') || 
    safeBaseUrl.includes('127.0.0.1') ||
    safeBaseUrl.includes('192.168.');

  // Convert any format of headers to a plain Record
  let requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (isDevelopmentOrNgrok) {
    requestHeaders['Bypass-Tunnel-Reminder'] = 'true';
    requestHeaders['ngrok-skip-browser-warning'] = 'true';
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // ✅ Safely merge options.headers (supporting Headers object, Array, or plain Record)
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        requestHeaders[key] = value;
      });
    } else {
      // It's a plain object
      requestHeaders = {
        ...requestHeaders,
        ...options.headers as Record<string, string>,
      };
    }
  }

  const config: RequestInit = {
    ...options,
    headers: requestHeaders,
  };

  try {
    // ✅ Defensive Logging: Log final request URL, response status, and if ngrok bypass header is attached
    const hasNgrokBypass = !!requestHeaders['ngrok-skip-browser-warning'];
    console.log(`[AUDIT API] ▶️ Starting fetch to: ${fullUrl}`);
    console.log(`[AUDIT API] ℹ️ ngrok bypass header attached: ${hasNgrokBypass ? 'YES' : 'NO'}`);
    
    const response = await fetch(fullUrl, config);
    
    console.log(`[AUDIT API] ◀️ Received response from: ${fullUrl} - Status: ${response.status} ${response.statusText}`);
    const parsed = await handleResponse(response) as Promise<T>;
    console.log(`[AUDIT API] ✅ Successfully parsed response from: ${fullUrl}`);
    return parsed;
  } catch (error) {
    console.error(`[AUDIT API] ❌ Network error on: ${fullUrl}:`, error);
    throw error;
  }
};

/**
 * Safe destination fetch — guards against undefined/null IDs.
 */
export const getDestinationById = async (id: string | undefined | null): Promise<Destination | null> => {
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('🚫 getDestinationById: Invalid ID:', id);
    return null;
  }
  console.log('📍 getDestinationById called with ID:', id);
  try {
    const res = await apiClient<Destination>(`/destinations/${id}`);
    console.log('✅ getDestinationById result:', res?.name);
    return res;
  } catch (err) {
    console.error('❌ getDestinationById failed:', err);
    return null;
  }
};

export const authAPI = {
  register: (data: RegisterData): Promise<AuthResponse> =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: (): Promise<User> =>
    apiClient<User>('/auth/me'),

  updateProfile: (data: Partial<User>): Promise<User> =>
    apiClient<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  savePlace: (placeId: string): Promise<any> =>
    apiClient('/auth/save-place', {
      method: 'POST',
      body: JSON.stringify({ placeId }),
    }),

  unsavePlace: (placeId: string): Promise<any> =>
    apiClient(`/auth/save-place/${placeId}`, {
      method: 'DELETE',
    }),

  getSavedPlaces: (): Promise<Destination[]> =>
    apiClient<Destination[]>('/auth/saved-places'),

  sendOtp: (email: string): Promise<{ message: string }> =>
    apiClient<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resendOtp: (email: string): Promise<{ message: string }> =>
    apiClient<{ message: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string): Promise<OTPVerifyResponse> =>
    apiClient<OTPVerifyResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
};

export const destinationsAPI = {
  getAll: (params?: Record<string, string | number>): Promise<{ destinations: Destination[], total: number }> => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return apiClient(`/destinations/${queryString ? '?' + queryString : ''}`);
  },

  getFeatured: (limit: number = 6): Promise<Destination[]> =>
    apiClient<Destination[]>(`/destinations/featured?limit=${limit}`),

  getCategories: (): Promise<{ name: string; count: number }[]> =>
    apiClient(`/destinations/categories`),

  getPlace: (idOrName: string): Promise<Destination> =>
    apiClient<Destination>(`/destinations/${idOrName}`),

  getWeather: (id: string): Promise<any> =>
    apiClient(`/destinations/${id}/weather`),

  getExploreData: (): Promise<any> =>
    apiClient('/destinations/explore-data'),

  getRoutePlan: (start: string, end: string): Promise<any> =>
    apiClient(`/destinations/route-plan?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),

  getPlaces: (category?: string, search?: string): Promise<{ destinations: Destination[], total: number }> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString();
    // ✅ Fixed: Added trailing slash to match FastAPI's @places_router.get("/")
    return apiClient(`/places/${qs ? '?' + qs : ''}`);
  },

  getSmartRecommendations: (params: {
    user_lat: number;
    user_lng: number;
    max_budget?: number;
    max_time_hours?: number;
  }): Promise<{ results: Destination[], count: number, has_exact_matches: boolean }> => {
    const query = new URLSearchParams();
    query.append('user_lat', params.user_lat.toString());
    query.append('user_lng', params.user_lng.toString());
    if (params.max_budget) query.append('max_budget', params.max_budget.toString());
    if (params.max_time_hours) query.append('max_time_hours', params.max_time_hours.toString());
    return apiClient<{ results: Destination[], count: number, has_exact_matches: boolean }>(`/destinations/recommendations?${query.toString()}`);
  }
};

export const tripsAPI = {
  getAll: (): Promise<Trip[]> =>
    apiClient<Trip[]>('/trips'),

  create: (tripData: TripCreate): Promise<Trip> =>
    apiClient<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }),

  getById: (id: string): Promise<Trip> =>
    apiClient<Trip>(`/trips/${id}`),

  update: (id: string, tripData: Partial<TripCreate>): Promise<{ message: string }> =>
    apiClient<{ message: string }>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient<{ message: string }>(`/trips/${id}`, {
      method: 'DELETE',
    }),

  duplicate: (id: string): Promise<Trip> =>
    apiClient<Trip>(`/trips/${id}/duplicate`, {
      method: 'POST',
    }),
};

export const expensesAPI = {
  getByTrip: (tripId: string): Promise<{ trip_id: string; total: number; expenses: Expense[] }> =>
    apiClient(`/expenses/trip/${tripId}`),

  create: (expenseData: ExpenseCreate): Promise<Expense> =>
    apiClient<Expense>('/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  update: (id: string, expenseData: Partial<ExpenseCreate>): Promise<{ message: string }> =>
    apiClient<{ message: string }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
};

export const aiAPI = {
  generateTripPlan: (data: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    budgetType: string;
    travelers: number;
    pace: string;
    accommodation?: string;
    stops?: string[];
    notes?: string;
  }): Promise<any> =>
    apiClient('/ai/ai-trip-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateRoadTripIntelligence: (data: {
    origin: string;
    destination: string;
  }): Promise<any> =>
    apiClient('/ai/road-trip-intelligence', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};