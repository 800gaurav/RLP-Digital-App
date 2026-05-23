import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/auth.store';
import IDCard from '../components/digital-id/IDCard';
import Button from '../components/ui/Button';
import AppBottomNav from '../components/navigation/AppBottomNav';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

export default function DigitalIdScreen() {
  const { user } = useAuthStore();
  if (!user) return null;

  const issueDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const designation = user.designation || (user.role === 'admin' ? 'RLP Admin Member' : 'RLP Digital Member');

  const generateHtml = () => `
    <!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      @page{size:420px 672px;margin:0}body{margin:0;padding:24px;background:#fff8ef;font-family:Inter,Arial,sans-serif;color:#231b00}
      .card{height:624px;border-radius:28px;padding:24px;box-sizing:border-box;background:linear-gradient(135deg,#ffd700 0%,#f4c430 56%,#0f7b3e 100%);position:relative;overflow:hidden;box-shadow:0 18px 42px rgba(0,0,0,.22)}
      .top{display:flex;justify-content:space-between;align-items:flex-start}.kicker{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;opacity:.58}
      .logo{width:58px;height:58px;border-radius:16px;background:white;display:flex;align-items:center;justify-content:center;color:#0f7b3e;font-weight:900;margin-top:6px}
      .badge{background:#0f7b3e;color:white;border-radius:999px;padding:7px 12px;font-size:10px;font-weight:900;letter-spacing:.4px}.unit{text-align:right;font-size:10px;font-weight:700;opacity:.72;margin-top:6px}
      .center{text-align:center;margin-top:28px}.photo{width:178px;height:178px;border-radius:24px;border:5px solid white;object-fit:cover;background:#0f7b3e}
      .initial{width:178px;height:178px;border-radius:24px;border:5px solid white;background:#0f7b3e;color:white;font-size:64px;font-weight:900;display:inline-flex;align-items:center;justify-content:center}
      .name{font-size:28px;line-height:32px;font-weight:900;margin-top:18px}.designation{font-size:13px;font-weight:700;opacity:.74;margin-top:4px}
      .pill{display:inline-flex;gap:8px;background:rgba(255,255,255,.5);border-radius:999px;padding:8px 14px;margin-top:12px;font-size:12px;font-weight:800}.label{font-size:9px;opacity:.58;letter-spacing:.8px}
      .location{font-size:14px;font-weight:700;opacity:.78;margin-top:12px}.footer{position:absolute;left:24px;right:24px;bottom:24px;border-top:1px solid rgba(35,27,0,.14);padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end}
      .sig{font-size:9px;font-weight:900;letter-spacing:.9px;text-transform:uppercase;opacity:.48}.line{width:130px;height:1px;background:rgba(35,27,0,.58);margin-top:26px}.auth{font-size:10px;font-weight:700;opacity:.72;margin-top:5px}
      .meta{display:flex;gap:22px;margin-top:13px}.meta div{font-size:11px;font-weight:900}.qr{width:94px;height:94px;background:white;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#4d4632;text-align:center}
    </style></head>
    <body><div class="card">
      <div class="top"><div><div class="kicker">Membership ID</div><div class="logo">RLP</div></div><div><div class="badge">VERIFIED MEMBER</div><div class="unit">Rajasthan Unit</div></div></div>
      <div class="center">
        ${user.profilePhoto ? `<img class="photo" src="${escapeHtml(user.profilePhoto)}"/>` : `<div class="initial">${escapeHtml(user.fullName?.charAt(0) || 'R')}</div>`}
        <div class="name">${escapeHtml(user.fullName)}</div><div class="designation">${escapeHtml(designation)}</div>
        <div class="pill"><span class="label">VOTER ID</span>${escapeHtml(user.voterId)}</div>
        <div class="location">${escapeHtml(user.district || user.city)}, ${escapeHtml(user.state)}</div>
      </div>
      <div class="footer"><div><div class="sig">Digital Stamp</div><div class="line"></div><div class="auth">Authorized Signatory</div><div class="meta"><div><span class="sig">Issue Date</span><br/>${issueDate}</div><div><span class="sig">Validity</span><br/><span style="color:#0f7b3e">Lifetime</span></div></div></div><div class="qr">Scan QR<br/>to Verify</div></div>
    </div></body></html>`;

  const sharePdf = async (dialogTitle) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHtml(), width: 420, height: 672 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle });
      else Alert.alert('PDF Saved', `Saved to: ${uri}`);
    } catch (_error) {
      Alert.alert('Export failed', 'Could not generate the ID card PDF.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Digital ID Card</Text>
        <Text style={styles.headerRight}>RLP Digital</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardWrapper}>
          <IDCard user={user} />
        </View>
        <View style={styles.actions}>
          <Button variant="primary" title="Download PDF" onPress={() => sharePdf('Save Digital ID Card')} />
          <View style={{ height: 12 }} />
          <Button variant="secondary" title="Share Card" onPress={() => sharePdf('Share Digital ID Card')} />
        </View>
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: Colors.background },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  backIcon: { fontSize: 28, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  headerRight: { fontFamily: FontFamily.black, fontSize: 12, color: Colors.onSurface, width: 78, textAlign: 'right' },
  scrollContent: { padding: 20, paddingBottom: 28, alignItems: 'center' },
  cardWrapper: { width: '100%', maxWidth: 360, marginTop: 8, marginBottom: 30 },
  actions: { width: '100%', maxWidth: 360 },
});
