import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
      <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>
        IF YOU SEE THIS, IT WORKS!
      </Text>
      <Text style={{ color: 'white', fontSize: 20, marginTop: 20 }}>
        Today is {new Date().toLocaleDateString()}
      </Text>
    </View>
  );
}