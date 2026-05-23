import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function Button({ variant, title, onPress, loading = false, disabled = false, style, icon }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    (disabled || loading) && styles.disabled,
    style,
  ];
  const textStyle = [
    styles.label,
    variant === 'primary' && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'ghost' && styles.labelGhost,
  ];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={containerStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? Colors.onSurface : Colors.white} size="small" />
        ) : (
          <>
            {icon ? <Text style={[textStyle, styles.icon]}>{icon}</Text> : null}
            <Text style={textStyle}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%', gap: 8,
  },
  primary: { backgroundColor: Colors.rlpYellow },
  secondary: { backgroundColor: Colors.rlpGreen },
  ghost: { backgroundColor: Colors.transparent, borderWidth: 1, borderColor: Colors.outlineVariant },
  disabled: { opacity: 0.6 },
  label: { fontFamily: FontFamily.semiBold, fontSize: 16, lineHeight: 22 },
  labelPrimary: { color: Colors.onSurface },
  labelSecondary: { color: Colors.white },
  labelGhost: { color: Colors.onSurface },
  icon: { fontSize: 18 },
});
