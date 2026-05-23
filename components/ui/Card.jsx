import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function Card({ children, style, onPress, padding = 16 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const cardStyle = [styles.card, { padding }, style];
  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable style={cardStyle} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} accessibilityRole="button">
          {children}
        </Pressable>
      </Animated.View>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
});
