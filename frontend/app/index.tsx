import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('📱 Index - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ marginTop: 15, color: '#fff', fontWeight: 'bold' }}>Syncing Experience...</Text>
        <Text style={{ marginTop: 8, color: '#666', fontSize: 12 }}>Please wait a moment</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    console.log('➡️ Redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  console.log('➡️ Redirecting to login');
  return <Redirect href="/auth/login" />;
}