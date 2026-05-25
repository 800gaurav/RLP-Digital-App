import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getPadadhikari } from '../../services/padadhikari.service';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const RANK_LABELS = { national: 'National', state: 'State', district: 'District', block: 'Block' };

function DetailRow({ icon, label, value }) {
  const displayValue = value || '-';
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={17} color={Colors.rlpGreen} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{displayValue}</Text>
      </View>
    </View>
  );
}

export default function PadadhikariDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: officials = [] } = useQuery({ queryKey: ['padadhikari'], queryFn: () => getPadadhikari() });
  const official = officials.find((o) => String(o.id) === String(id));

  const Header = ({ title }) => (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );

  if (!official) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Official" />
        <View style={styles.notFound}><Text style={styles.notFoundText}>Official not found</Text></View>
        <AppBottomNav />
      </SafeAreaView>
    );
  }

  const photoUri = official.imageUrl || official.photoUrl || official.thumbnailUrl;
  const level = RANK_LABELS[official.rank] ?? official.rank;
  const district = official.district || official.districtName || official.district_name;
  const phone = official.phone || official.contactNumber || official.mobile || official.mobileNumber;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={official.fullName} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.photoRing}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" accessibilityLabel={`${official.fullName} photo`} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoInitial}>{official.fullName?.charAt(0)?.toUpperCase() || 'R'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{official.fullName}</Text>
          <View style={styles.designationBadge}><Text style={styles.designationText}>{official.designation}</Text></View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Information</Text>
          <DetailRow icon="ribbon-outline" label="Level" value={level} />
          <DetailRow icon="briefcase-outline" label="Designation" value={official.designation} />
          <DetailRow icon="map-outline" label="State" value={official.state} />
          <DetailRow icon="location-outline" label="District" value={district} />
          <DetailRow icon="call-outline" label="Phone" value={phone} />
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, marginLeft: 4 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  profileCard: {
    backgroundColor: Colors.rlpGreen, borderRadius: 18, padding: 22,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.rlpGreenDark,
  },
  photoRing: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.rlpYellow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  photo: { width: 108, height: 108, borderRadius: 54, backgroundColor: Colors.rlpGreenDark },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontFamily: FontFamily.bold, fontSize: 44, color: Colors.white },
  name: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.white, textAlign: 'center', marginBottom: 8 },
  designationBadge: { backgroundColor: Colors.rlpYellow, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 14 },
  designationText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurface },
  detailsCard: {
    backgroundColor: Colors.white, marginTop: 14, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.onSurface, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  infoIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurfaceVariant },
});
