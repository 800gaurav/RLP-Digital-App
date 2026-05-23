import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Image as SvgImage, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1440;

function escapeXml(value = '') {
  return String(value).replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[char]));
}

export function buildPosterSvg(template, user) {
  const accent = template.accent || Colors.rlpGreen;
  const bgImage = template.imageUrl
    ? `<image href="${escapeXml(template.imageUrl)}" x="0" y="0" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="100%" height="100%" fill="${accent}"/><text x="72" y="180" font-size="56" font-weight="900" fill="#FFD700">RLP DIGITAL</text><text x="72" y="1260" font-size="92" font-weight="900" fill="#FFFFFF">${escapeXml(template.name)}</text>`;
  const photo = user.profilePhoto
    ? `<clipPath id="photoClip"><circle cx="540" cy="1060" r="128"/></clipPath><image href="${escapeXml(user.profilePhoto)}" x="412" y="932" width="256" height="256" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
    : `<circle cx="540" cy="1060" r="128" fill="#0F7B3E"/><text x="540" y="1098" text-anchor="middle" font-size="112" font-weight="900" fill="#FFFFFF">${escapeXml(user.fullName?.charAt(0) || 'R')}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="60%" stop-color="#000" stop-opacity=".25"/><stop offset="100%" stop-color="#000" stop-opacity=".78"/></linearGradient>
  </defs>
  ${bgImage}
  <rect width="100%" height="100%" fill="url(#fade)"/>
  <rect x="48" y="48" width="984" height="1344" rx="46" fill="none" stroke="#FFD700" stroke-width="8" opacity=".9"/>
  <rect x="96" y="88" width="220" height="62" rx="31" fill="#0F7B3E"/><text x="206" y="130" text-anchor="middle" font-size="26" font-weight="900" fill="#FFFFFF">RLP DIGITAL</text>
  <circle cx="540" cy="1060" r="144" fill="#FFFFFF"/><circle cx="540" cy="1060" r="134" fill="#FFD700"/>${photo}
  <text x="540" y="1266" text-anchor="middle" font-size="58" font-weight="900" fill="#FFFFFF">${escapeXml(user.fullName)}</text>
  <text x="540" y="1318" text-anchor="middle" font-size="30" font-weight="700" fill="#FFD700">${escapeXml(user.district || user.city || 'Rajasthan')}</text>
  <text x="540" y="1370" text-anchor="middle" font-size="26" font-weight="700" fill="#FFFFFF">Rashtriya Loktantrik Party</text>
</svg>`;
}

export default function PosterEditor({ template, user, onClose }) {
  const [saving, setSaving] = useState(false);
  const posterSvg = useMemo(() => buildPosterSvg(template, user), [template, user]);

  const handleDownload = async () => {
    setSaving(true);
    try {
      const safeName = (template.name || 'rlp-poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const uri = `${FileSystem.documentDirectory}${safeName}-${Date.now()}.svg`;
      await FileSystem.writeAsStringAsync(uri, posterSvg, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'image/svg+xml', dialogTitle: 'Save RLP Poster' });
      else Alert.alert('Poster Ready', `Saved to: ${uri}`);
    } catch (_error) {
      Alert.alert('Export failed', 'Could not generate the poster file.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewShell}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}`}>
          <Defs>
            <LinearGradient id="previewFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#000" stopOpacity="0" />
              <Stop offset="65%" stopColor="#000" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          {template.imageUrl ? (
            <SvgImage href={{ uri: template.imageUrl }} x="0" y="0" width={POSTER_WIDTH} height={POSTER_HEIGHT} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <Rect width={POSTER_WIDTH} height={POSTER_HEIGHT} fill={template.accent || Colors.rlpGreen} />
              <SvgText x="72" y="180" fontSize="56" fontWeight="900" fill={Colors.rlpYellow}>RLP DIGITAL</SvgText>
              <SvgText x="72" y="1260" fontSize="92" fontWeight="900" fill="#FFFFFF">{template.name}</SvgText>
            </>
          )}
          <Rect width={POSTER_WIDTH} height={POSTER_HEIGHT} fill="url(#previewFade)" />
          <Rect x="48" y="48" width="984" height="1344" rx="46" fill="none" stroke={Colors.rlpYellow} strokeWidth="8" opacity="0.9" />
          <Rect x="96" y="88" width="220" height="62" rx="31" fill={Colors.rlpGreen} />
          <SvgText x="206" y="130" textAnchor="middle" fontSize="26" fontWeight="900" fill="#FFFFFF">RLP DIGITAL</SvgText>
          <Circle cx="540" cy="1060" r="144" fill="#FFFFFF" />
          <Circle cx="540" cy="1060" r="134" fill={Colors.rlpYellow} />
          {user.profilePhoto ? (
            <SvgImage href={{ uri: user.profilePhoto }} x="412" y="932" width="256" height="256" preserveAspectRatio="xMidYMid slice" />
          ) : (
            <>
              <Circle cx="540" cy="1060" r="128" fill={Colors.rlpGreen} />
              <SvgText x="540" y="1098" textAnchor="middle" fontSize="112" fontWeight="900" fill="#FFFFFF">{user.fullName?.charAt(0) || 'R'}</SvgText>
            </>
          )}
          <SvgText x="540" y="1266" textAnchor="middle" fontSize="58" fontWeight="900" fill="#FFFFFF">{user.fullName}</SvgText>
          <SvgText x="540" y="1318" textAnchor="middle" fontSize="30" fontWeight="700" fill={Colors.rlpYellow}>{user.district || user.city || 'Rajasthan'}</SvgText>
          <SvgText x="540" y="1370" textAnchor="middle" fontSize="26" fontWeight="700" fill="#FFFFFF">Rashtriya Loktantrik Party</SvgText>
        </Svg>
      </View>
      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]} onPress={onClose}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.85 }]} onPress={handleDownload} disabled={saving}>
          <Text style={styles.downloadText}>{saving ? 'Preparing...' : 'Download Poster'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', padding: 20 },
  previewShell: {
    width: '100%',
    maxWidth: 330,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.rlpGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 22,
  },
  actions: { width: '100%', maxWidth: 330, flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.white },
  secondaryText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurfaceVariant },
  downloadBtn: { flex: 1.4, backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  downloadText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
});
