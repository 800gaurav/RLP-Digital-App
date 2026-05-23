import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const BENEFITS = [
  '500+ Premium Templates',
  'No Watermark & HD Export',
  'Personal Photo Customization',
];

export default function PaywallModal({ visible, price, onSubscribe, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          {/* Header matching Figma */}
          <View style={styles.header}>
            <View style={styles.headerIconBox}>
              <Text style={styles.headerIcon}>🎨</Text>
            </View>
          </View>

          <Text style={styles.title}>Unlock Poster Maker</Text>
          <Text style={styles.description}>Create stunning personalized RLP posters, festive greetings, and rally banners with ease.</Text>

          {/* Price box matching Figma */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>PREMIUM PLAN</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{price}</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.subscribeBtn, pressed && { opacity: 0.85 }]} onPress={onSubscribe} accessibilityRole="button" accessibilityLabel="Subscribe Now">
            <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
          </Pressable>

          <Text style={styles.finePrint}>Cancel anytime. Terms and conditions apply.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'flex-end' },
  card: { width: '100%', backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, overflow: 'hidden' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.onSurfaceVariant, fontFamily: FontFamily.semiBold },
  header: { backgroundColor: Colors.rlpYellow, paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  headerIconBox: { width: 64, height: 64, backgroundColor: Colors.white, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  headerIcon: { fontSize: 36 },
  title: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.onSurface, textAlign: 'center', marginTop: 20, marginBottom: 8, paddingHorizontal: 24 },
  description: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 20, paddingHorizontal: 24 },
  priceBox: { marginHorizontal: 24, backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.primaryFixed, alignItems: 'center' },
  priceLabel: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#715D00', letterSpacing: 1, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: FontFamily.black, fontSize: 36, color: Colors.onSurface },
  pricePeriod: { fontFamily: FontFamily.regular, fontSize: 16, color: Colors.onSurfaceVariant },
  benefitsList: { paddingHorizontal: 28, gap: 12, marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  checkIcon: { fontSize: 13, color: Colors.rlpGreen, fontFamily: FontFamily.bold },
  benefitText: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface, flex: 1 },
  subscribeBtn: { marginHorizontal: 24, backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12, shadowColor: '#FFD400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  subscribeBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.onSurface },
  finePrint: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
