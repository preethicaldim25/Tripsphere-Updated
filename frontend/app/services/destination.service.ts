import { API_URL } from '../../get_urls';

/**
 * Service for fetching destination related data.
 * Provides simple wrapper functions used by the HomeScreen.
 */
export const destinationService = {
  /**
   * Retrieve data for the home hero carousel (featured destinations).
   */
  async getFeatured() {
    const resp = await fetch(`${API_URL}/api/destinations/featured`);
    if (!resp.ok) throw new Error('Failed to fetch featured destinations');
    return resp.json();
  },

  /**
   * Retrieve explore data (weekend trips, AI picks, low‑crowd cities, etc.).
   */
  async getExploreData() {
    const resp = await fetch(`${API_URL}/api/destinations/explore-data`);
    if (!resp.ok) throw new Error('Failed to fetch explore data');
    return resp.json();
  },

  /**
   * Retrieve the full list of destinations for search.
   */
  async getAll() {
    const resp = await fetch(`${API_URL}/api/destinations/`);
    if (!resp.ok) throw new Error('Failed to fetch destinations');
    return resp.json();
  },
};
