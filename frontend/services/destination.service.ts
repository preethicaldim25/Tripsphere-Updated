import { destinationsAPI } from './api';
/* Import the type from api.ts instead of @/types */
import { Destination } from './api'; 

export const destinationService = {
  /* Get all destinations */
  getAll: async (): Promise<Destination[]> => {
    try {
      const response = await destinationsAPI.getAll();
      /* Check if response has destinations property */
      return response.destinations || [];
    } catch (error) {
      console.error('Error fetching destinations:', error);
      return [];
    }
  },

  /* Get featured destinations */
  getFeatured: async (): Promise<Destination[]> => {
    try {
      const response = await destinationsAPI.getFeatured();
      return response;
    } catch (error) {
      console.error('Error fetching featured:', error);
      return [];
    }
  },

  /* Get destination by ID */
  getById: async (id: string): Promise<Destination | null> => {
    try {
      const response = await destinationsAPI.getPlace(id);
      return response;
    } catch (error) {
      console.error(`Error fetching destination ${id}:`, error);
      return null;
    }
  },

  /* Get destinations by category */
  getByCategory: async (category: string): Promise<Destination[]> => {
    try {
      const response = await destinationsAPI.getAll({ category });
      return response.destinations || [];
    } catch (error) {
      console.error(`Error fetching ${category}:`, error);
      return [];
    }
  },

  /* Get all categories */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await destinationsAPI.getCategories();
      return response.map((cat: any) => cat.name);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  /* Get weather for destination */
  getWeather: async (destinationId: string) => {
    try {
      const response = await destinationsAPI.getWeather(destinationId);
      return response;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  },

  /* Get explore data */
  getExploreData: async () => {
    try {
      const response = await destinationsAPI.getExploreData();
      return response;
    } catch (error) {
      console.error('Error fetching explore data:', error);
      return null;
    }
  },
};