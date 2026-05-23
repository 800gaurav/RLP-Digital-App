import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

function TabIcon({ name, focused, label }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <Ionicons name={name} size={22} color={focused ? Colors.rlpGreen : Colors.onSurfaceVariant} />
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="poster-maker"
        options={{
          title: 'Poster Maker',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'color-palette' : 'color-palette-outline'} focused={focused} label="Poster" />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'play-circle' : 'play-circle-outline'} focused={focused} label="Status" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    height: Platform.OS === 'ios' ? 82 : 74,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabBarItem: {
    height: 54,
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
    minWidth: 54,
    maxWidth: 76,
  },
  tabIconContainerActive: {
    backgroundColor: Colors.primaryContainer,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.rlpGreen,
  },
});
