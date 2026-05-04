import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  getTrips as getTripsApi, 
  getTripById as getTripByIdApi,
  createTrip as createTripApi,
  updateTrip as updateTripApi,
  deleteTrip as deleteTripApi
} from '@/services/api';
import { useAuth } from './AuthContext';

export type ItineraryItem = {
  day: number;
  description: string;
};

export type Trip = {
  _id: string;
  user_id: string;
  title: string;
  destination_name: string;
  destination_image: string;
  location: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  used_budget: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'saved';
  members: string[];
  itinerary: ItineraryItem[];
  created_at: string;
};

type TripContextValue = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  fetchTrips: (status?: string, page?: number) => Promise<void>;
  getTripById: (id: string) => Promise<Trip | null>;
  createTrip: (tripData: Partial<Trip>) => Promise<void>;
  updateTrip: (id: string, tripData: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export const TripProvider = ({ children }: { children: React.ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrips = useCallback(async (status?: string, page: number = 1) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getTripsApi(status, page);
      if (response.success) {
        setTrips(response.data);
      } else {
        setError(response.message || 'Failed to fetch trips');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
      console.error('Fetch trips error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getTripById = async (id: string): Promise<Trip | null> => {
    try {
      const response = await getTripByIdApi(id);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Get trip by id error:', err);
      return null;
    }
  };

  const createTrip = async (tripData: Partial<Trip>) => {
    setLoading(true);
    try {
      const response = await createTripApi(tripData);
      if (response.success) {
        await fetchTrips(tripData.status);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTrip = async (id: string, tripData: Partial<Trip>) => {
    setLoading(true);
    try {
      const response = await updateTripApi(id, tripData);
      if (response.success) {
        setTrips(prev => prev.map(t => t._id === id ? response.data : t));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id: string) => {
    setLoading(true);
    try {
      const response = await deleteTripApi(id);
      if (response.success) {
        setTrips(prev => prev.filter(t => t._id !== id));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TripContext.Provider value={{
      trips,
      loading,
      error,
      fetchTrips,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
