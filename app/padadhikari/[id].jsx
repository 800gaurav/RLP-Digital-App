import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPadadhikari } from '../../services/padadhikari.service';
import Button from '../../components/ui/Button';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const RANK_LABELS = { national: 'National', state: 'State', district: 'District' };

export default function PadadhikariDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: officials = [] } = useQuery({ queryKey: ['padadhikari'], queryFn: () => getPadadhikari() });
  const official = officials.find((o) => o.id === id);

  const handleCall = () => {
    if (official?.contactNumber) {
      Linking.openURL(`tel:${official.contactNumber}`).catch(() => Alert.alert('Error', 'Could not open phone dialer.'));
    }
  };

  const handleShare = async () => {
    if (!official) return;
    try { await Share.share({ message: `${official.fullName} — ${official.designation}\n${official.district}, ${official.state}\nRLP Digital Connect` }); }
    catch (_e) {}
  };

  const Header = ({ title }) => (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backIcon}>←</Text>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={official.fullName} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {official.photoUrl ? (
          <Image source={{ uri: official.photoUrl }} style={styles.photo} resizeMode="cover" accessibilityLabel={`${official.fullName} photo`} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{official.fullName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.detailsCard}>
          <Text style={styles.name}>{official.fullName}</Text>
          <View style={styles.designationBadge}><Text style={styles.designationText}>{official.designation}</Text></View>
          {[['Rank', RANK_LABELS[official.rank] ?? official.rank], ['District', official.district], ['State', official.state]].map(([label, value]) => (
            <React.Fragment key={label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
              <View style={styles.divider} />
            </React.Fragment>
          ))}
          {official.contactVisible && official.contactNumber && (
            <View style={styles.contactSection}>
              <Text style={styles.contactLabel}>Contact</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactNumber}>{official.contactNumber}</Text>
                <Pressable style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]} onPress={handleCall} accessibilityRole="button">
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        <View style={styles.shareContainer}><Button variant="secondary" title="Share" onPress={handleShare} icon="↗" /></View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, marginLeft: 4 },
  scrollContent: { paddingBottom: 28 },
  photo: { width: '100%', height: 200 },
  photoPlaceholder: { backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontFamily: FontFamily.bold, fontSize: 72, color: Colors.white },
  detailsCard: { backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  name: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.onSurface, marginBottom: 10 },
  designationBadge: { alignSelf: 'flex-start', backgroundColor: Colors.secondaryContainer, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12, marginBottom: 16 },
  designationText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.rlpGreen },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
  infoValue: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface },
  divider: { height: 1, backgroundColor: Colors.outlineVariant },
  contactSection: { paddingTop: 12 },
  contactLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactNumber: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.onSurface },
  callBtn: { backgroundColor: Colors.rlpGreen, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  callBtnText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.white },
  shareContainer: { paddingHorizontal: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurfaceVariant },
});
