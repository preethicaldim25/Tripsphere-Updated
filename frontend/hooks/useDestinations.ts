import { useState, useEffect } from 'react';
import { destinationService } from '@/services/destination.service';
import { Destination } from '@/types';

export const useDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [featured, setFeatured] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dests, featuredDests, cats] = await Promise.all([
        destinationService.getAll(),
        destinationService.getFeatured(),
        destinationService.getCategories(),
      ]);
      
      setDestinations(dests);
      setFeatured(featuredDests);
      setCategories(cats);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    destinations,
    featured,
    categories,
    loading,
    error,
    refresh: loadData,
  };
};