import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import FloatingEmoji from './FloatingEmoji';

const EMOJIS = ['🎉', '✨', '💜', '🧳', '✈️', '🌄', '🗺️', '🎊'];

export default function CelebrationEffects() {
  const [emojis, setEmojis] = useState<{ id: number, emoji: string, delay: number }[]>([]);
  const particleCount = Platform.OS === 'web' ? 30 : 50;

  useEffect(() => {
    // Generate a batch of floating emojis
    const newEmojis = Array.from({ length: Platform.OS === 'web' ? 10 : 15 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      delay: Math.random() * 1500,
    }));
    setEmojis(newEmojis);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Platform.OS !== 'web' && (
        React.createElement(require('react-native-confetti-cannon').default, {
          count: particleCount,
          origin: { x: Dimensions.get('window').width / 2, y: -20 },
          fallSpeed: 2500,
          fadeOut: true
        })
      )}
      {emojis.map((item) => (
        <FloatingEmoji key={item.id} emoji={item.emoji} delay={item.delay} />
      ))}
    </View>
  );
}
