import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

function IDAction({ icon, label, onPress, primary }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, primary && styles.actionBtnPrimary, pressed && styles.actionBtnPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ID Card`}
    >
      <Ionicons name={icon} size={15} color={primary ? Colors.white : Colors.rlpGreen} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

export default function IDCardPreview({ user, onViewPress, onDownloadPress, onSharePress }) {
  return (
    <View style={styles.card}>
      <View style={styles.gradientOverlay} />
      <View style={styles.content}>
        <Avatar uri={user.profilePhoto} name={user.fullName} size={64} borderColor={Colors.rlpGreen} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{user.fullName}</Text>
          <View style={styles.designationRow}>
            <Text style={styles.designation}>Karyakarta</Text>
          </View>
          <Text style={styles.voterId} numberOfLines={1}>{user.voterId}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <IDAction icon="card-outline" label="View ID" onPress={onViewPress} primary />
        <IDAction icon="download-outline" label="Download" onPress={onDownloadPress} />
        <IDAction icon="share-social-outline" label="Share" onPress={onSharePress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, overflow: 'hidden', marginHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    backgroundColor: Colors.rlpYellow,
  },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.rlpYellowDark, opacity: 0.35 },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface, lineHeight: 20 },
  designationRow: { alignSelf: 'flex-start', backgroundColor: Colors.rlpGreen, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  designation: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.white },
  voterId: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  actionBtn: {
    flex: 1, minHeight: 38, borderRadius: 999,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: 'rgba(8,122,51,0.18)',
    paddingHorizontal: 8,
  },
  actionBtnPrimary: { backgroundColor: Colors.rlpGreen, borderColor: Colors.rlpGreen },
  actionBtnPressed: { opacity: 0.85 },
  actionText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.rlpGreen, textAlign: 'center' },
  actionTextPrimary: { color: Colors.white },
});
