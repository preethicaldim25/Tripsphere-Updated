import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';
import {
  TouchableOpacity,
  View,
  Platform,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import React, { useState, useRef } from 'react';
import CustomSidebar from '../../components/CustomSidebar';

const { width } = Dimensions.get('window');

// ─── Tab bar icon with active indicator ──────────────────────────────────────
function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={tabIconStyles.wrapper}>
      {focused && <View style={tabIconStyles.activeGlow} />}
      <View style={[tabIconStyles.iconWrap, focused && tabIconStyles.iconWrapActive]}>
        <Ionicons name={name} size={22} color={color} />
      </View>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124,92,255,0.12)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(124,92,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.35)',
  },
});

// ─── Main layout ─────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { theme, toggleTheme, colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, { toValue: -300, duration: 280, useNativeDriver: true }).start(() =>
        setSidebarVisible(false)
      );
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#7C5CFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
          tabBarStyle: {
            backgroundColor: '#0F0F22',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 80 : 68,
            paddingBottom: Platform.OS === 'ios' ? 22 : 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 18 : 12,
            left: '6%',
            right: '6%',
            width: '88%',
            alignSelf: 'center',
            borderRadius: 28,
            elevation: 20,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            zIndex: 100,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.2,
            marginTop: -2,
          },
          tabBarItemStyle: {
            paddingTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
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
            style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sidebarContainer: {
    width: 300,
    height: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
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