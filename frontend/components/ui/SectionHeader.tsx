import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/themecontext';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  marginTop?: number;
}

export function SectionHeader({ title, actionText, onActionPress, marginTop = 30 }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { marginTop }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionText && (
        <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionText}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  }
});
