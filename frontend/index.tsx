import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.bigText}>✅ THIS IS THE NEW HOME SCREEN ✅</Text>
      <Text style={styles.smallText}>If you see this, it worked!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C41E3A',
  },
  bigText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  smallText: {
    color: 'white',
    fontSize: 16,
  },
});