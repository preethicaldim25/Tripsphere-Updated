/**
 * 🛠️ TRIPSPHERE API CONFIGURATION
 * -------------------------------
 * 1. For Real Devices (Expo Go / APK): Use your current ngrok URL
 * 2. For Web: localhost:8000 works fine
 */

// ⚠️ UPDATE THIS URL EVERY TIME YOU RESTART NGROK
const NGROK_URL = "https://tricky-dedicate-quill.ngrok-free.dev"; 

export const API_URL = `${NGROK_URL}/api`;

console.log('-------------------------------------------');
console.log('🚀 TRIPSPHERE API CONFIG');
console.log('🔗 Base URL:', NGROK_URL);
console.log('📡 API Endpoint:', API_URL);
console.log('-------------------------------------------');
