import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const { q } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Search Results' }} />
      <Text style={styles.title}>Searching for: {q}</Text>
      <Text style={styles.subtitle}>Search results coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
});