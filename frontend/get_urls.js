import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API CONFIGURATION
 * Web  → always http://localhost:8000/api
 * Android emulator → 10.0.2.2:8000
 * Physical device  → auto-detected LAN IP or fallback
 */

const PORT = '8000';
const DEV_IP_FALLBACK = '192.168.1.74';

export const getApiUrl = () => {
  // ✅ Web always uses localhost — no tunnel needed
  if (Platform.OS === 'web') {
    const url = `http://localhost:${PORT}/api`;
    console.log('🌐 [API] Web platform → using localhost:', url);
    return url;
  }

  if (__DEV__) {
    // Auto-detect Expo host IP for physical device
    const hostUri = Constants.expoConfig?.hostUri;
    const detectedIp = hostUri ? hostUri.split(':')[0] : null;
    const isValidIp = detectedIp && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(detectedIp) && !detectedIp.startsWith('127.');

    if (isValidIp) {
      const url = `http://${detectedIp}:${PORT}/api`;
      console.log('📱 [API] Auto-detected device IP:', url);
      return url;
    }

    // Android emulator
    if (Platform.OS === 'android') {
      const url = `http://10.0.2.2:${PORT}/api`;
      console.log('🤖 [API] Android emulator:', url);
      return url;
    }

    // iOS simulator
    if (Platform.OS === 'ios') {
      const url = `http://localhost:${PORT}/api`;
      console.log('🍎 [API] iOS simulator:', url);
      return url;
    }
  }

  // Fallback to manual LAN IP
  const url = `http://${DEV_IP_FALLBACK}:${PORT}/api`;
  console.log('🏠 [API] Fallback manual IP:', url);
  return url;
};

export const API_URL = getApiUrl();

console.log('-------------------------------------------');
console.log('🔗 TRIPSPHERE API_URL:', API_URL);
console.log('📱 Platform:', Platform.OS);
console.log('⚙️  Mode:', __DEV__ ? 'Development' : 'Production');
console.log('-------------------------------------------');