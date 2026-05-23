import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../ui/Avatar';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function IDCardPreview({ user, onDownloadPress }) {
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
        <Pressable
          style={({ pressed }) => [styles.downloadBtn, pressed && styles.downloadBtnPressed]}
          onPress={onDownloadPress}
          accessibilityRole="button"
          accessibilityLabel="Download ID Card"
        >
          <Text style={styles.downloadText}>Download{'\n'}ID</Text>
        </Pressable>
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
  content: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface, lineHeight: 20 },
  designationRow: { alignSelf: 'flex-start', backgroundColor: Colors.rlpGreen, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  designation: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.white },
  voterId: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
  downloadBtn: {
    backgroundColor: Colors.rlpGreen, borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  downloadBtnPressed: { opacity: 0.8 },
  downloadText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.white, textAlign: 'center', lineHeight: 15 },
});
