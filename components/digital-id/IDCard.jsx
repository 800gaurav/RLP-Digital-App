import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { brandBottle, brandLogo } from '../../constants/brandAssets';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { resolveMediaUrl } from '../../services/media';

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
        <View style={styles.watermark}>
          <Image source={brandLogo} style={styles.watermarkImage} resizeMode="contain" />
        </View>

        <View style={styles.topRow}>
          <View style={styles.logoPartyRow}>
            <Text style={styles.kicker}>Membership ID</Text>
            <View style={styles.logoPartyInner}>
              <View style={styles.logoBox}>
                <Image source={brandBottle} style={styles.logoImage} resizeMode="contain" />
              </View>
             
            </View>
          </View>
          <View style={styles.verifiedWrap}>
            <Text style={styles.verifiedText}>VERIFIED MEMBER</Text>
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
        </View>

        <View style={styles.footer}>
          <LinearGradient
            colors={['#0B6B33', '#167B3E', '#D9A900']}
            locations={[0, 0.58, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.partyBlock}
          >
            <View style={styles.partyGlow} />
            <Text style={styles.partyLabel}>Party</Text>
            <Text style={styles.partyName}>Rashtriya Loktantrik Party</Text>
            <Text style={styles.partyUnit}>Official Member Card</Text>
          </LinearGradient>
          <View style={styles.metaColumn}>
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>{user.district || user.city}, {user.state}</Text>
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
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    aspectRatio: 4.9 / 8.6,
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
  watermarkImage: { width: 170, height: 170 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, zIndex: 1 },
  kicker: { fontFamily: FontFamily.bold, fontSize: 10, color: 'rgba(35,27,0,0.58)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  logoPartyRow: { flex: 1, minWidth: 0 },
  logoPartyInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#7A5A00',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  logoImage: { width: 54, height: 54, opacity: 1 },
  verifiedWrap: { alignItems: 'flex-end', flexShrink: 0 },
  verifiedText: { fontFamily: FontFamily.black, fontSize: 8.5, color: Colors.white, backgroundColor: Colors.rlpGreen, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', letterSpacing: 0.25 },
  identity: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 15, zIndex: 1 },
  photoGlow: { position: 'absolute', top: 18, width: 178, height: 178, borderRadius: 24, backgroundColor: 'rgba(15,123,62,0.18)' },
  photo: { width: 164, height: 164, borderRadius: 22, borderWidth: 4, borderColor: Colors.white, marginBottom: 18, backgroundColor: Colors.rlpGreen },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontFamily: FontFamily.black, fontSize: 60, color: Colors.white },
  name: { fontFamily: FontFamily.black, fontSize: 25, lineHeight: 30, color: '#231B00', textAlign: 'center' },
  designation: { fontFamily: FontFamily.semiBold, fontSize: 12, color: 'rgba(35,27,0,0.72)', marginTop: 3, marginBottom: 10 },
  voterPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.48)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 14, zIndex: 1 },
  voterLabel: { fontFamily: FontFamily.black, fontSize: 9, color: 'rgba(35,27,0,0.56)', letterSpacing: 0.8 },
  voterValue: { fontFamily: FontFamily.bold, fontSize: 12, color: '#231B00' },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(35,27,0,0.12)', paddingTop: 14, zIndex: 1 },
  smallLabel: { fontFamily: FontFamily.black, fontSize: 8, color: 'rgba(35,27,0,0.48)', letterSpacing: 0.9, textTransform: 'uppercase' },
  partyBlock: { flex: 1, minHeight: 96, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', padding: 12, justifyContent: 'flex-end', alignItems: 'flex-start', marginRight: 12, overflow: 'hidden', shadowColor: '#0B5E2D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
  partyGlow: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.14)', top: -28, right: -20 },
  partyLabel: { fontFamily: FontFamily.black, fontSize: 8, color: 'rgba(255,249,230,0.78)', letterSpacing: 1, textTransform: 'uppercase' },
  partyName: { fontFamily: FontFamily.black, fontSize: 18, lineHeight: 21, color: Colors.white, textAlign: 'left', marginTop: 7, textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  partyUnit: { fontFamily: FontFamily.medium, fontSize: 9, color: 'rgba(255,244,204,0.92)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaColumn: { width: 112, alignItems: 'stretch' },
  locationPill: { backgroundColor: 'rgba(255,255,255,0.42)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 7 },
  locationText: { fontFamily: FontFamily.bold, fontSize: 9, color: 'rgba(35,27,0,0.74)', textAlign: 'center' },
  metaBlock: { minHeight: 96, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.46)', padding: 10, justifyContent: 'space-between', alignItems: 'flex-end' },
  metaValue: { fontFamily: FontFamily.bold, fontSize: 11, color: '#231B00', marginTop: 2 },
  metaValueGreen: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.rlpGreen, marginTop: 2 },
});
