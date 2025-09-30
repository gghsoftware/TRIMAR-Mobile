import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/design';
import Index from '../../app/index';
import Profile from '../../app/profile';
import AdminDashboard from '../../app/admin';

const Tab = createBottomTabNavigator();

// Tab bar icon component
function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      home: '🏠',
      profile: '👤',
      admin: '⚙️',
      bookings: '📅',
    };
    return icons[iconName] || '❓';
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.6 }]}>
        {getIcon(name)}
      </Text>
    </View>
  );
}

// Tab bar label component
function TabBarLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.label, { color: focused ? Colors.primary : Colors.textSecondary }]}>
      {label}
    </Text>
  );
}

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Index}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Home" focused={focused} />,
        }}
      />
      
      <Tab.Screen
        name="Bookings"
        component={Index} // You can create a separate bookings screen
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="bookings" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Bookings" focused={focused} />,
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Profile" focused={focused} />,
        }}
      />
      
      {/* Admin tab - only show for admin users */}
      <Tab.Screen
        name="Admin"
        component={AdminDashboard}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="admin" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Admin" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabBarLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
});
