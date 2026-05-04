export interface Destination {
  id: string;
  _id?: string;
  name: string;
  category: string;
  image: string;
  images: string[];
  carousel_images?: string[];
  description: string;
  longDescription?: string;
  location: string;
  district: string;
  rating: number;
  reviewCount: number;
  budget: string;
  estimated_budget?: number;
  bestTime: string;
  overview: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isFeatured: boolean;
  speciality_tags?: string[];
  ai_recommendations?: {
    best_time: string;
    crowd_tips: string;
    hidden_tip: string;
  };
  attractions?: any[];
  food?: any[];
  accommodation?: any[];
  highlights?: string[];
  nearby?: any[];
  nearby_places?: any[];
  weather?: any;
  cuisine?: string[];
  tips?: string[];
  timeRequired?: string;
  is_exact_match?: boolean;
  real_time_duration?: string;
  smart_tags?: string[];
  ai_score?: number;
  avg_cost_per_person?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  forecast?: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Trip {
  id: string;
  _id?: string;
  name?: string;
  destinationId: string;
  destination: string;
  start_location?: string;
  stops?: string[];
  startDate: string;
  start_date?: string;
  endDate: string;
  end_date?: string;
  budget: number;
  budget_breakdown?: any;
  travelers: number;
  status: 'planned' | 'ongoing' | 'completed';
  notes?: string;
  itinerary?: any[];
}

export interface Expense {
  id: string;
  tripId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}