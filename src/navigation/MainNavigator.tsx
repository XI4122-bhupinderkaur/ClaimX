import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import ClaimDetailsScreen from '../screens/ClaimDetailsScreen';
import ClaimsScreen from '../screens/ClaimsScreen';
import CreateClaimScreen from '../screens/CreateClaimScreen';
import PoliciesScreen from '../screens/PoliciesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator = (): React.JSX.Element => (
  <Stack.Navigator initialRouteName="Dashboard">
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="Claims" component={ClaimsScreen} />
    <Stack.Screen name="CreateClaim" component={CreateClaimScreen} />
    <Stack.Screen name="ClaimDetails" component={ClaimDetailsScreen} />
    <Stack.Screen name="Policies" component={PoliciesScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export default MainNavigator;
