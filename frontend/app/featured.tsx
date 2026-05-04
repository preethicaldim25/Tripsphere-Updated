import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function FeaturedScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Featured Destinations' }} />
      <Text style={styles.text}>Featured Screen</Text>
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
  text: {
    fontSize: 18,
    color: '#7E60BF',
  },
});