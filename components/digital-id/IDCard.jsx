import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { resolveMediaUrl } from '../../services/media';

function BottleMark() {
  return (
    <View style={styles.logoBox}>
      <View style={styles.logoNeck} />
      <View style={styles.logoBody}>
        <Text style={styles.logoText}>RLP</Text>
      </View>
    </View>
  );
}

export default function IDCard({ user }) {
  const profilePhoto = resolveMediaUrl(user.profilePhoto);
  const issueDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const designation = user.designation || (user.role === 'admin' ? 'RLP Admin Member' : 'RLP Digital Member');

  return (
    <View style={styles.shadowWrap}>
      <LinearGradient
        colors={[Colors.idCardGradientStart, Colors.idCardGradientMid, Colors.idCardGradientEnd]}
        locations={[0, 0.56, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.patternDotOne} />
        <View style={styles.patternDotTwo} />
        <View style={styles.watermark}><Text style={styles.watermarkText}>RLP</Text></View>

        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>Membership ID</Text>
            <BottleMark />
          </View>
          <View style={styles.verifiedWrap}>
            <Text style={styles.verifiedText}>VERIFIED MEMBER</Text>
            <Text style={styles.unitText}>Rajasthan Unit</Text>
          </View>
        </View>

        <View style={styles.identity}>
          <View style={styles.photoGlow} />
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoInitial}>{user.fullName?.charAt(0)?.toUpperCase() ?? 'R'}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{user.fullName}</Text>
          <Text style={styles.designation}>{designation}</Text>
          <View style={styles.voterPill}>
            <Text style={styles.voterLabel}>VOTER ID</Text>
            <Text style={styles.voterValue}>{user.voterId}</Text>
          </View>
          <Text style={styles.location}>{user.district || user.city}, {user.state}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.smallLabel}>Digital Stamp</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signatory</Text>
          </View>
          <View style={styles.metaBlock}>
            <View>
              <Text style={styles.smallLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{issueDate}</Text>
            </View>
            <View>
              <Text style={styles.smallLabel}>Validity</Text>
              <Text style={styles.metaValueGreen}>Lifetime</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    aspectRatio: 5 / 8,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  card: { flex: 1, borderRadius: 26, padding: 18, overflow: 'hidden' },
  patternDotOne: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(15,123,62,0.13)', top: -92, left: -88 },
  patternDotTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.16)', bottom: -58, right: -48 },
  watermark: { position: 'absolute', right: -16, top: 138, opacity: 0.055, transform: [{ rotate: '-12deg' }] },
  watermarkText: { fontFamily: FontFamily.black, fontSize: 108, color: Colors.onSurface },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 },
  kicker: { fontFamily: FontFamily.bold, fontSize: 10, color: 'rgba(35,27,0,0.58)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  logoBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  logoNeck: { width: 12, height: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: Colors.rlpGreen },
  logoBody: { width: 26, height: 26, borderRadius: 7, backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: FontFamily.black, fontSize: 8, color: Colors.white },
  verifiedWrap: { alignItems: 'flex-end' },
  verifiedText: { fontFamily: FontFamily.black, fontSize: 10, color: Colors.white, backgroundColor: Colors.rlpGreen, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, overflow: 'hidden', letterSpacing: 0.4 },
  unitText: { fontFamily: FontFamily.medium, fontSize: 9, color: 'rgba(35,27,0,0.72)', marginTop: 5 },
  identity: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10, zIndex: 1 },
  photoGlow: { position: 'absolute', top: 18, width: 178, height: 178, borderRadius: 24, backgroundColor: 'rgba(15,123,62,0.18)' },
  photo: { width: 164, height: 164, borderRadius: 22, borderWidth: 4, borderColor: Colors.white, marginBottom: 18, backgroundColor: Colors.rlpGreen },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontFamily: FontFamily.black, fontSize: 60, color: Colors.white },
  name: { fontFamily: FontFamily.black, fontSize: 25, lineHeight: 30, color: '#231B00', textAlign: 'center' },
  designation: { fontFamily: FontFamily.semiBold, fontSize: 12, color: 'rgba(35,27,0,0.72)', marginTop: 3, marginBottom: 10 },
  voterPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.48)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  voterLabel: { fontFamily: FontFamily.black, fontSize: 9, color: 'rgba(35,27,0,0.56)', letterSpacing: 0.8 },
  voterValue: { fontFamily: FontFamily.bold, fontSize: 12, color: '#231B00' },
  location: { fontFamily: FontFamily.medium, fontSize: 13, color: 'rgba(35,27,0,0.76)', marginTop: 10 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(35,27,0,0.12)', paddingTop: 14, zIndex: 1 },
  signatureBlock: { flex: 1, paddingTop: 16, paddingRight: 14 },
  smallLabel: { fontFamily: FontFamily.black, fontSize: 8, color: 'rgba(35,27,0,0.48)', letterSpacing: 0.9, textTransform: 'uppercase' },
  signatureLine: { width: 118, height: 1, backgroundColor: 'rgba(35,27,0,0.55)', marginTop: 18, marginBottom: 4 },
  signatureText: { fontFamily: FontFamily.medium, fontSize: 9, color: 'rgba(35,27,0,0.7)' },
  metaBlock: { width: 104, minHeight: 96, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.46)', padding: 10, justifyContent: 'space-between' },
  metaValue: { fontFamily: FontFamily.bold, fontSize: 11, color: '#231B00', marginTop: 2 },
  metaValueGreen: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.rlpGreen, marginTop: 2 },
});
