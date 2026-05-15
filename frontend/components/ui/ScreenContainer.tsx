import React from 'react';
import { View, SafeAreaView, StyleSheet, ScrollView, ViewStyle, StatusBar } from 'react-native';
import { useTheme } from '../../context/themecontext';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  padded?: boolean;
}

export function ScreenContainer({ 
  children, 
  scrollable = false, 
  style, 
  contentContainerStyle,
  padded = false 
}: ScreenContainerProps) {
  const { colors, theme } = useTheme();

  const Container = scrollable ? ScrollView as any : View;
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <Container 
        style={[styles.container, style]} 
        contentContainerStyle={[padded && styles.paddedContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  paddedContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  }
});
