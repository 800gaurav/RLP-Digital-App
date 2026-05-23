import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { resolveMediaUrl } from '../../services/media';

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (!parts.length || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ uri, name, size = 40, borderColor = Colors.primaryContainer }) {
  const [imageFailed, setImageFailed] = useState(false);
  const circleStyle = { width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor };
  const fontSize = Math.round(size * 0.36);
  const resolvedUri = resolveMediaUrl(uri);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUri]);

  if (resolvedUri && !imageFailed) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[styles.image, circleStyle]}
        accessibilityLabel={`${name || 'User'} avatar`}
        onError={() => setImageFailed(true)}
      />
    );
  }
  return (
    <View style={[styles.placeholder, circleStyle]} accessibilityLabel={`${name || 'User'} avatar`}>
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: { backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.white, fontFamily: FontFamily.semiBold },
});
