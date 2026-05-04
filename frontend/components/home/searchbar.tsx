import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/themecontext';

const { width } = Dimensions.get('window');

interface Props {
  onPress?: () => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<Props> = ({ 
  onPress, 
  onSearch, 
  placeholder = 'Search destinations...' 
}) => {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = React.useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <View style={styles.placeholderContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <View style={styles.placeholderText}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
});