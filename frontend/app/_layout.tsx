import { Stack, ErrorBoundary } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { TripProvider } from '../context/TripContext';
import { ThemeProvider } from '../context/themecontext';
import { View, Platform, StyleSheet, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    console.log(`🚀 RootLayout: [${Platform.OS}] Mounting...`);
    if (loaded || error) {
      console.log('🚀 RootLayout: Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync().catch(err => {
        console.warn('🚀 RootLayout: Failed to hide splash screen:', err);
      });
    }
    
    // Safety timeout: If fonts don't load in 10s, hide splash anyway
    const timer = setTimeout(() => {
      console.log('🚀 RootLayout: Font loading timeout, forcing splash hide');
      SplashScreen.hideAsync().catch(() => {});
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const Content = () => (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
      <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
      <Stack.Screen name="auth/verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="destination/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="festivals" options={{ title: 'Festivals & Culture' }} />
      <Stack.Screen name="plan-trip" options={{ title: 'Plan a Trip' }} />
      <Stack.Screen name="nearby" options={{ title: 'Nearby Places' }} />
      <Stack.Screen name="saved" options={{ title: 'Saved Places' }} />
      <Stack.Screen name="road-trip" options={{ title: 'Road Trip' }} />
      <Stack.Screen name="weekend-trips" options={{ title: 'Weekend Trips' }} />
      <Stack.Screen name="hidden-gems" options={{ title: 'Hidden Gems' }} />
      <Stack.Screen name="popular" options={{ title: 'Popular Places' }} />
      <Stack.Screen name="category/[name]" options={{ title: 'Category' }} />
      <Stack.Screen name="expenses/add" options={{ title: 'Add Expense' }} />
      <Stack.Screen name="trip/[id]" options={{ title: 'Trip Details' }} />
      <Stack.Screen name="trip/create" options={{ title: 'Create Trip' }} />
      <Stack.Screen name="trip/[id]/itinerary" options={{ title: 'Itinerary' }} />
      <Stack.Screen name="trip/[id]/summary" options={{ title: 'Summary' }} />
      <Stack.Screen name="map" options={{ title: 'Explore Map' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <TripProvider>
            <ThemeProvider>
              {Platform.OS === 'web' ? (
                <View style={styles.webOverlay}>
                  <View style={styles.webContainer}>
                    <Content />
                  </View>
                </View>
              ) : (
                <View style={styles.nativeRoot}>
                  <Content />
                </View>
              )}
            </ThemeProvider>
          </TripProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export { ErrorBoundary } from 'expo-router';

const styles = StyleSheet.create({
  nativeRoot: {
    flex: 1,
  },
  webOverlay: {
    flex: 1,
    height: '100%',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  }
});