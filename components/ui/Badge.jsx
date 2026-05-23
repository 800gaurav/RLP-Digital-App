import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function Badge({ label, variant, size = 'md' }) {
  const containerStyle = [
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    variant === 'green' && styles.green,
    variant === 'yellow' && styles.yellow,
    variant === 'red' && styles.red,
  ];
  const textStyle = [
    styles.label,
    size === 'sm' ? styles.labelSm : styles.labelMd,
    variant === 'green' && styles.textGreen,
    variant === 'yellow' && styles.textYellow,
    variant === 'red' && styles.textRed,
  ];
  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, alignSelf: 'flex-start' },
  sm: { paddingVertical: 4, paddingHorizontal: 8 },
  md: { paddingVertical: 6, paddingHorizontal: 12 },
  green: { backgroundColor: Colors.secondaryContainer },
  yellow: { backgroundColor: Colors.primaryContainer },
  red: { backgroundColor: Colors.errorContainer },
  label: { fontFamily: FontFamily.semiBold },
  labelSm: { fontSize: 10, lineHeight: 14 },
  labelMd: { fontSize: 12, lineHeight: 16 },
  textGreen: { color: Colors.rlpGreen },
  textYellow: { color: Colors.onPrimaryContainer },
  textRed: { color: Colors.error },
});
