import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function OfficialCard({ official, onPress }) {
  const district = official.district || official.districtName || official.district_name;
  const phone = official.phone || official.contactNumber || official.mobile || official.mobileNumber;
  const location = [district || '-', official.state].filter(Boolean).join(', ');
  const photoUri = official.imageUrl || official.photoUrl || official.thumbnailUrl;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
      onPress={() => onPress(official)}
      accessibilityRole="button"
      accessibilityLabel={official.fullName}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoInitial}>{official.fullName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{official.fullName}</Text>
        <Text style={styles.designation} numberOfLines={1}>{official.designation}</Text>
        <Text style={styles.location} numberOfLines={1}>{location}</Text>
        <Text style={styles.contact} numberOfLines={1}>Phone: {phone || '-'}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  photo: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  photoPlaceholder: { backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface, marginBottom: 2 },
  designation: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.rlpGreen, marginBottom: 2 },
  location: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant },
  contact: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 3 },
  chevron: { fontSize: 20, color: Colors.outline },
});
