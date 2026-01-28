import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ScanScreen from '../screens/ScanScreen';
import PosScreen from '../screens/PosScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MoreScreen from '../screens/MoreScreen';
import { colors, radius, shadow, spacing } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Dashboard: 'home',
  Inventory: 'package',
  Scan: 'camera',
  POS: 'shopping-cart',
  Receive: 'truck',
  Reports: 'bar-chart-2',
  More: 'menu',
};

function TabIcon({ name, focused, color }) {

  if (name === 'POS') {
    return (
      <View style={[styles.posButton, focused && styles.posButtonActive]}>
        <Feather name="shopping-cart" size={24} color={focused ? colors.surface : colors.primary} />
      </View>
    );
  }
  return <Feather name={tabIcons[name]} size={22} color={color} />;
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: (route.name === 'Scan' || route.name === 'POS') ? styles.raisedTabItem : null,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />

        <Tab.Screen
        name="POS"
        component={PosScreen}
        options={{
          tabBarLabel: () => null,
        }}
      />
     <Tab.Screen name="Receive" component={OrdersScreen} /> 
     <Tab.Screen name="Reports" component={ReportsScreen} /> 
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.sm,
    ...shadow.lg,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  posButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 28,
    borderWidth: 3,
    borderColor: colors.primary,
    ...shadow.md,
  },
  posButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  raisedTabItem: {
    marginTop: -20,
  },
});
