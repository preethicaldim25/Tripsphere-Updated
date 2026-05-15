import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  tripsAPI
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
  refreshTrips: () => Promise<void>;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export const TripProvider = ({ children }: { children: React.ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrips = useCallback(async (status?: string, page: number = 1) => {
    console.log('[AUDIT] 4. fetchTrips started');
    if (!user) {
      console.log('[AUDIT] fetchTrips aborted: No user');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Add a safety timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
          console.log('[AUDIT] 💥 Timeout triggered after 8 seconds!');
          reject(new Error('Fetch trips timeout'));
      }, 8000)
    );

    try {
      console.log('[AUDIT] 5. API request sent via tripsAPI.getAll()');
      const dataPromise = tripsAPI.getAll();
      const data = await Promise.race([dataPromise, timeoutPromise]) as Trip[];
      console.log(`[AUDIT] 6. Backend response received. Valid array? ${Array.isArray(data)} | Count: ${data?.length}`);
      setTrips(data || []);
      console.log('[AUDIT] 7. trips state updated');
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
      console.error('[AUDIT] ❌ Fetch trips error caught:', err);
    } finally {
      console.log('[AUDIT] 8. loading state set false (finally block executed!)');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTrips();
    } else {
      setTrips([]);
    }
  }, [user, fetchTrips]);

  const getTripById = useCallback(async (id: string): Promise<Trip | null> => {
    try {
      return await tripsAPI.getById(id);
    } catch (err) {
      console.error('Get trip by id error:', err);
      return null;
    }
  }, []);

  const createTrip = useCallback(async (tripData: Partial<Trip>) => {
    setLoading(true);
    try {
      await tripsAPI.create(tripData as any);
      await fetchTrips();
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTrips]);

  const updateTrip = useCallback(async (id: string, tripData: Partial<Trip>) => {
    setLoading(true);
    try {
      await tripsAPI.update(id, tripData as any);
      setTrips(prev => prev.map(t => t._id === id || t.id === id ? { ...t, ...tripData } : t));
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await tripsAPI.delete(id);
      setTrips(prev => prev.filter(t => t._id !== id && t.id !== id));
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TripContext.Provider value={{
      trips,
      loading,
      error,
      fetchTrips,
      getTripById,
      createTrip,
      updateTrip,
      deleteTrip,
      refreshTrips: fetchTrips
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
