import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/destination';

export const useWeather = (location?: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy'> = 
        ['sunny', 'cloudy', 'rainy', 'partly-cloudy'];
      
      const mockWeather: WeatherData = {
        temperature: Math.floor(Math.random() * 15) + 25, // 25-40°C
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        location: location || 'Tamil Nadu',
        humidity: Math.floor(Math.random() * 40) + 40, 
        windSpeed: Math.floor(Math.random() * 20) + 5,
        forecast: [
          { day: 'Today', temp: 28, condition: 'sunny' },
          { day: 'Tomorrow', temp: 29, condition: 'partly-cloudy' },
          { day: 'Day 3', temp: 27, condition: 'cloudy' },
        ],
      };
      
      setTimeout(() => {
        setWeather(mockWeather);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load weather');
      setLoading(false);
    }
  };

  return { weather, loading, error, refresh: fetchWeather };
};