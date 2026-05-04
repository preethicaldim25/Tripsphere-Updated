import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';
import { TouchableOpacity, View, Platform, Modal, StyleSheet, Animated, Dimensions, StatusBar, Text } from 'react-native';
import React, { useState, useRef } from 'react';
import CustomSidebar from '../../components/CustomSidebar';

const { width } = Dimensions.get('window');

export default function TabsLayout() {
  const { theme, toggleTheme, colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.card} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 70 : 65,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 20 : 15,
            left: '5%',
            right: '5%',
            width: '90%',
            alignSelf: 'center',
            borderRadius: 25,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            zIndex: 100,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: colors.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={toggleSidebar} style={{ marginLeft: 15, padding: 8 }}>
              <Ionicons name="menu-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 15, alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={toggleTheme} style={{ padding: 8 }}>
                <Ionicons 
                  name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
              {isAuthenticated && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                  <View style={[styles.miniAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.miniAvatarText}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Custom Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={toggleSidebar}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={toggleSidebar} 
          />
          <Animated.View 
            style={[
              styles.sidebarContainer, 
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <CustomSidebar onClose={toggleSidebar} />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContainer: {
    width: 300,
    height: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});