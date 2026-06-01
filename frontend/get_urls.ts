import { Platform } from 'react-native';

/**
 * 🛠️ TRIPSPHERE API CONFIGURATION
 * -------------------------------
 * This file centralizes all API connection logic for both Web and Mobile.
 */

// 1. FOR NGROK USERS: Paste your current ngrok URL here
// Example: "https://abc-123.ngrok-free.dev"
export const NGROK_URL = "https://tricky-dedicate-quill.ngrok-free.dev"; 

// 2. FOR LOCAL NETWORK USERS: Paste your computer's IPv4 address here
// Get it by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
export const LOCAL_IP = "192.168.1.74"; 

const getBaseUrl = () => {
  // If we are on Web, always use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  // If we have an NGROK URL, prioritize it for mobile/physical devices
  if (NGROK_URL && NGROK_URL.includes('ngrok')) {
    return NGROK_URL;
  }

  // Fallback to Local IP for mobile (localhost doesn't work on real devices)
  return `http://${LOCAL_IP}:8000`;
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;

console.log('-------------------------------------------');
console.log('🚀 TRIPSPHERE API CONFIG');
console.log('📱 Platform:', Platform.OS);
console.log('🔗 Base URL:', BASE_URL);
console.log('📡 API Endpoint:', API_URL);
console.log('-------------------------------------------');
