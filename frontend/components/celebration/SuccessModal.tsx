import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import CelebrationEffects from './CelebrationEffects';
import GlowButton from './GlowButton';
import { Ionicons } from '@expo/vector-icons';

interface SuccessModalProps {
  visible: boolean;
  onExplore: () => void;
  onLater: () => void;
  destination?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function SuccessModal({ visible, onExplore, onLater, destination = "Kodaikanal" }: SuccessModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const checkScale = useSharedValue(0);
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowEffects(true);
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      checkScale.value = withTiming(1, { duration: 500, easing: Easing.elastic(1.5) });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      scale.value = withTiming(0.9, { duration: 250 });
      setShowEffects(false);
    }
  }, [visible]);

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedCheck = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <AnimatedView style={[styles.overlay, animatedOverlay]}>
        
        {showEffects && <CelebrationEffects />}

        <AnimatedView style={[styles.card, animatedCard]}>
          <View style={styles.content}>
            <AnimatedView style={[styles.iconContainer, animatedCheck]}>
              <Ionicons name="checkmark-circle" size={90} color="#10b981" />
            </AnimatedView>

            <Text style={styles.title}>Wooohooo! 🎉</Text>
            <Text style={styles.subtitle}>
              Pack your bags! Your dream trip to <Text style={styles.highlight}>{destination}</Text> is officially ready! 🤩
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GlowButton 
              title="Let’s Explore!" 
              onPress={onExplore} 
              variant="primary" 
              icon={<Ionicons name="chevron-forward" size={18} color="#fff" />}
            />
            <GlowButton title="Save for Later" onPress={onLater} variant="secondary" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Adventure Awaits! 🗺️✨</Text>
          </View>
        </AnimatedView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e1e24', // match the dark grey in the image
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#dddddd',
    textAlign: 'center',
    lineHeight: 22,
  },
  highlight: {
    color: '#a855f7', // purple
    fontWeight: '700',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#25252a', // slightly darker background for buttons section like in image
  },
  footer: {
    backgroundColor: '#111111',
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#a855f7', // purple
    fontSize: 16,
    fontWeight: '700',
  }
});
