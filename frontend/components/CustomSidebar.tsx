import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themecontext';

interface DrawerItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}

const DrawerItem = ({ label, icon, route, isActive, onPress, colors }: DrawerItemProps) => (
  <TouchableOpacity
    style={[
      styles.drawerItem,
      isActive && { backgroundColor: `${colors.primary}15`, borderLeftWidth: 4, borderLeftColor: colors.primary },
    ]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={22}
      color={isActive ? colors.primary : colors.textSecondary}
    />
    <Text
      style={[
        styles.drawerItemText,
        { color: isActive ? colors.primary : colors.text },
        isActive && { fontWeight: '700' },
      ]}
    >
      {label}
    </Text>
    {isActive && (
      <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
    )}
  </TouchableOpacity>
);

export default function CustomSidebar({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (route: any) => {
    onClose();
    router.push(route);
  };

  const isRouteActive = (route: string) => {
    if (route === '/(tabs)' && pathname === '/') return true;
    return pathname.startsWith(route.replace('/(tabs)/', '/'));
  };

  const menuItems: { label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
    { label: 'Home', icon: 'home-outline', route: '/(tabs)' },
    { label: 'Explore', icon: 'compass-outline', route: '/(tabs)/explore' },
    { label: 'Trips', icon: 'map-outline', route: '/(tabs)/trips' },
    { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
  ];

  return (
    <SafeAreaView style={[styles.sidebar, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
          <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
            {user?.name ? (
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <Ionicons name="person-circle" size={80} color={colors.textLight} />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'Guest User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'tripsphere@example.com'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Navigation</Text>
          {menuItems.map((item) => (
            <DrawerItem
              key={item.route}
              label={item.label}
              icon={item.icon}
              route={item.route}
              isActive={isRouteActive(item.route)}
              onPress={() => navigateTo(item.route)}
              colors={colors}
            />
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Account</Text>
          <DrawerItem
            label="Settings"
            icon="settings-outline"
            route="/settings" // Assume this exists or link to profile settings
            isActive={false}
            onPress={() => navigateTo('/(tabs)/profile')}
            colors={colors}
          />
          <DrawerItem
            label="Help & Support"
            icon="help-circle-outline"
            route="/support"
            isActive={false}
            onPress={() => navigateTo('/(tabs)/profile')}
            colors={colors}
          />
        </ScrollView>

        {/* Logout */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.logoutButton, { borderTopColor: colors.border }]}
            onPress={async () => {
              onClose();
              await logout();
              router.replace('/auth/login');
            }}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    width: 300,
    height: '100%',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 24,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 16,
    borderRadius: 50,
    padding: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 12,
    letterSpacing: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '600',
  },
});
