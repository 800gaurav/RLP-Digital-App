import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function TopAppBar({ user, onNotificationPress, onDigitalIdPress, onProfilePress }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable onPress={onProfilePress} accessibilityRole="button" accessibilityLabel="Open profile">
          <Avatar uri={user.profilePhoto} name={user.fullName} size={40} borderColor={Colors.primaryContainer} />
        </Pressable>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{user.fullName}</Text>
          <Pressable
            style={({ pressed }) => [styles.digitalIdPill, pressed && styles.pillPressed]}
            onPress={onDigitalIdPress}
            accessibilityRole="button"
            accessibilityLabel="View Digital ID"
          >
            <Ionicons name="id-card" size={13} color={Colors.white} />
            <Text style={styles.digitalIdText}>Digital ID</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.bellButton, pressed && styles.bellPressed]}
        onPress={onNotificationPress}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications" size={22} color={Colors.rlpGreen} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.rlpGreen, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4,
    elevation: 3, zIndex: 50,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  nameBlock: { flex: 1, gap: 4 },
  name: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.white, lineHeight: 20 },
  digitalIdPill: {
    alignSelf: 'flex-start', backgroundColor: Colors.rlpGreenDark,
    borderRadius: 999, paddingVertical: 2, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  pillPressed: { opacity: 0.75 },
  digitalIdText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  bellButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8, backgroundColor: Colors.white },
  bellPressed: { opacity: 0.75 },
});
