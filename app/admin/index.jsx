import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  createBroadcastNotification,
  getAdminContentSummary,
  getAdminOverview,
  getAdminUsers,
  updateAdminUserPermissions,
  updateSubscriptionPrice,
} from '../../services/admin.service';
import { useAuthStore } from '../../store/auth.store';
import { createPosterTemplate } from '../../services/poster.service';
import { createPadadhikari } from '../../services/padadhikari.service';
import { createTrainingVideo } from '../../services/videos.service';
import { createReel } from '../../services/reels.service';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const emptyOfficial = { fullName: '', designation: '', rank: 'district', state: 'Rajasthan', district: '', phone: '', email: '', photoUri: '' };
const emptyTraining = { title: '', description: '', duration: '', language: 'Hindi', videoUri: '', thumbnailUri: '' };
const emptyReel = { caption: '', mediaUri: '', mediaType: 'image' };

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={Colors.rlpGreen} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={Colors.outline}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function PrimaryButton({ title, icon, onPress, loading }) {
  return (
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator size="small" color={Colors.onSurface} /> : <Ionicons name={icon} size={18} color={Colors.onSurface} />}
      {!loading && <Text style={styles.primaryButtonText}>{title}</Text>}
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [broadcast, setBroadcast] = useState('');
  const [price, setPrice] = useState('');
  const [official, setOfficial] = useState(emptyOfficial);
  const [training, setTraining] = useState(emptyTraining);
  const [reel, setReel] = useState(emptyReel);
  const [template, setTemplate] = useState({ name: '', category: 'Rally', imageUri: '', isPremium: true });
  const [saving, setSaving] = useState('');

  const canAccessAdmin = user?.role === 'admin' || user?.isAdmin || user?.email?.endsWith('@rlpdigital.in');
  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview, enabled: canAccessAdmin });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers, enabled: canAccessAdmin });
  const { data: content } = useQuery({ queryKey: ['admin-content'], queryFn: getAdminContentSummary, enabled: canAccessAdmin });
  const stats = useMemo(() => overview ?? {}, [overview]);

  async function pickMedia(kind, setter, key, mediaTypes = ImagePicker.MediaTypeOptions.Images) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow media library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes, allowsEditing: false, quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setter((prev) => ({ ...prev, [key]: asset.uri, ...(kind === 'reel' ? { mediaType: asset.type === 'video' ? 'video' : 'image' } : {}) }));
    }
  }

  async function togglePermission(id, key, value) {
    try {
      await updateAdminUserPermissions(id, { [key]: value });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (_error) {
      Alert.alert('Update failed', 'Please try again.');
    }
  }

  async function submitBroadcast() {
    if (!broadcast.trim()) return Alert.alert('Notification', 'Message likhna jaruri hai.');
    setSaving('broadcast');
    try {
      await createBroadcastNotification({ title: 'RLP Suchna', body: broadcast.trim(), priority: true });
      setBroadcast('');
      Alert.alert('Sent', 'Notification sabhi users ko show hogi.');
    } catch (_error) {
      Alert.alert('Failed', 'Notification send nahi hui.');
    } finally {
      setSaving('');
    }
  }

  async function submitOfficial() {
    if (!official.fullName.trim() || !official.designation.trim()) return Alert.alert('Padadhikari', 'Name aur designation jaruri hai.');
    setSaving('official');
    try {
      await createPadadhikari(official);
      setOfficial(emptyOfficial);
      Alert.alert('Added', 'Padadhikari list mein add ho gaya.');
    } catch (_error) {
      Alert.alert('Failed', 'Padadhikari add nahi hua.');
    } finally {
      setSaving('');
    }
  }

  async function submitTraining() {
    if (!training.title.trim() || !training.videoUri) return Alert.alert('Training', 'Title aur video jaruri hai.');
    setSaving('training');
    try {
      await createTrainingVideo(training);
      setTraining(emptyTraining);
      Alert.alert('Uploaded', 'Training video users ko show hogi.');
    } catch (_error) {
      Alert.alert('Failed', 'Training video upload nahi hui.');
    } finally {
      setSaving('');
    }
  }

  async function submitReel() {
    if (!reel.caption.trim() || !reel.mediaUri) return Alert.alert('Party work status', 'Caption aur media jaruri hai.');
    setSaving('reel');
    try {
      await createReel(reel);
      setReel(emptyReel);
      Alert.alert('Uploaded', 'Status/reel users ko show hogi.');
    } catch (_error) {
      Alert.alert('Failed', 'Status upload nahi hua.');
    } finally {
      setSaving('');
    }
  }

  async function submitTemplate() {
    if (!template.name.trim() || !template.category.trim() || !template.imageUri) return Alert.alert('Template', 'Name, category aur image jaruri hai.');
    setSaving('template');
    try {
      await createPosterTemplate(template);
      setTemplate({ name: '', category: 'Rally', imageUri: '', isPremium: true });
      Alert.alert('Uploaded', 'Poster template users ke canvas mein available hoga.');
    } catch (_error) {
      Alert.alert('Failed', 'Template upload nahi hua.');
    } finally {
      setSaving('');
    }
  }

  async function submitPrice() {
    const numericPrice = Number(price);
    if (!numericPrice || numericPrice < 1) return Alert.alert('Subscription', 'Valid monthly price dalein.');
    setSaving('price');
    try {
      await updateSubscriptionPrice(numericPrice);
      setPrice('');
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      Alert.alert('Updated', 'Poster maker monthly plan update ho gaya.');
    } catch (_error) {
      Alert.alert('Failed', 'Price update nahi hua.');
    } finally {
      setSaving('');
    }
  }

  if (!canAccessAdmin) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.white} /></Pressable>
          <Text style={styles.headerTitle}>Admin</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.lockedState}>
          <Ionicons name="lock-closed" size={40} color={Colors.rlpYellow} />
          <Text style={styles.lockedTitle}>Admin access required</Text>
          <Text style={styles.lockedText}>Ye panel sirf approved RLP admin accounts ke liye hai.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.white} /></Pressable>
        <Text style={styles.headerTitle}>RLP Admin Control</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Master Panel</Text>
          <Text style={styles.heroTitle}>Party app ka content, users aur permissions yahin se manage honge.</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="people" label="Users" value={stats.users ?? '--'} />
          <StatCard icon="id-card" label="Subscribers" value={stats.activeSubscriptions ?? '--'} />
          <StatCard icon="ribbon" label="Padadhikari" value={content?.officials ?? stats.totalPadadhikari ?? '--'} />
          <StatCard icon="play-circle" label="Reels" value={stats.reels ?? '--'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Users</Text>
          {users.map((item) => (
            <View key={item.id} style={styles.userCard}>
              <View style={styles.userInitial}><Text style={styles.userInitialText}>{item.fullName?.charAt(0) ?? 'U'}</Text></View>
              <View style={styles.userBody}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userMeta}>{item.email}</Text>
                <Text style={styles.userMeta}>{item.voterId} | {item.city}, {item.district}</Text>
              </View>
              <View style={styles.switchGroup}>
                <Text style={styles.switchLabel}>Stamp</Text>
                <Switch value={!!item.stampPadAccess} onValueChange={(v) => togglePermission(item.id, 'stampPadAccess', v)} trackColor={{ false: Colors.outlineVariant, true: Colors.rlpGreen }} thumbColor={Colors.white} />
                <Text style={styles.switchLabel}>Plan</Text>
                <Switch value={item.subscriptionStatus === 'active'} onValueChange={(v) => togglePermission(item.id, 'subscriptionStatus', v ? 'active' : 'inactive')} trackColor={{ false: Colors.outlineVariant, true: Colors.rlpGreen }} thumbColor={Colors.white} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Notification</Text>
          <View style={styles.card}>
            <Field label="Message" value={broadcast} onChangeText={setBroadcast} placeholder="Event, suchna, ya urgent message" multiline />
            <PrimaryButton title="Send Notification" icon="notifications" onPress={submitBroadcast} loading={saving === 'broadcast'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Padadhikari</Text>
          <View style={styles.card}>
            <Field label="Full Name" value={official.fullName} onChangeText={(v) => setOfficial((p) => ({ ...p, fullName: v }))} />
            <Field label="Designation" value={official.designation} onChangeText={(v) => setOfficial((p) => ({ ...p, designation: v }))} />
            <Field label="District" value={official.district} onChangeText={(v) => setOfficial((p) => ({ ...p, district: v }))} />
            <Field label="Phone" value={official.phone} onChangeText={(v) => setOfficial((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
            <Pressable style={styles.outlineButton} onPress={() => pickMedia('official', setOfficial, 'photoUri')}><Ionicons name="image" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>{official.photoUri ? 'Change Photo' : 'Pick Photo'}</Text></Pressable>
            {official.photoUri ? <Image source={{ uri: official.photoUri }} style={styles.preview} /> : null}
            <PrimaryButton title="Add Padadhikari" icon="add-circle" onPress={submitOfficial} loading={saving === 'official'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Video</Text>
          <View style={styles.card}>
            <Field label="Title" value={training.title} onChangeText={(v) => setTraining((p) => ({ ...p, title: v }))} />
            <Field label="Description" value={training.description} onChangeText={(v) => setTraining((p) => ({ ...p, description: v }))} multiline />
            <View style={styles.row}>
              <Pressable style={styles.outlineButton} onPress={() => pickMedia('training', setTraining, 'videoUri', ImagePicker.MediaTypeOptions.Videos)}><Ionicons name="videocam" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>{training.videoUri ? 'Video Selected' : 'Pick Video'}</Text></Pressable>
              <Pressable style={styles.outlineButton} onPress={() => pickMedia('training', setTraining, 'thumbnailUri')}><Ionicons name="image" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>Thumbnail</Text></Pressable>
            </View>
            <PrimaryButton title="Upload Training" icon="cloud-upload" onPress={submitTraining} loading={saving === 'training'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Party Work Status/Reel</Text>
          <View style={styles.card}>
            <Field label="Caption" value={reel.caption} onChangeText={(v) => setReel((p) => ({ ...p, caption: v }))} multiline />
            <Pressable style={styles.outlineButton} onPress={() => pickMedia('reel', setReel, 'mediaUri', ImagePicker.MediaTypeOptions.All)}><Ionicons name="albums" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>{reel.mediaUri ? `${reel.mediaType} selected` : 'Pick Image/Video'}</Text></Pressable>
            {reel.mediaUri && reel.mediaType === 'image' ? <Image source={{ uri: reel.mediaUri }} style={styles.preview} /> : null}
            <PrimaryButton title="Upload Status" icon="play-circle" onPress={submitReel} loading={saving === 'reel'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poster Plan & Template</Text>
          <View style={styles.card}>
            <Field label={`Monthly Price (current Rs ${content?.subscriptionPrice ?? 99})`} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Example: 99" />
            <PrimaryButton title="Update Plan Price" icon="cash" onPress={submitPrice} loading={saving === 'price'} />
            <View style={styles.divider} />
            <Field label="Template Name" value={template.name} onChangeText={(v) => setTemplate((p) => ({ ...p, name: v }))} />
            <Field label="Category" value={template.category} onChangeText={(v) => setTemplate((p) => ({ ...p, category: v }))} />
            <View style={styles.inlineSwitch}>
              <Text style={styles.fieldLabel}>Premium Template</Text>
              <Switch value={template.isPremium} onValueChange={(v) => setTemplate((p) => ({ ...p, isPremium: v }))} trackColor={{ false: Colors.outlineVariant, true: Colors.rlpGreen }} thumbColor={Colors.white} />
            </View>
            <Pressable style={styles.outlineButton} onPress={() => pickMedia('template', setTemplate, 'imageUri')}><Ionicons name="image" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>{template.imageUri ? 'Change Template Image' : 'Pick Template Image'}</Text></Pressable>
            {template.imageUri ? <Image source={{ uri: template.imageUri }} style={styles.posterPreview} /> : null}
            <PrimaryButton title="Upload Template" icon="cloud-upload" onPress={submitTemplate} loading={saving === 'template'} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.rlpGreenDark },
  iconButton: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white },
  content: { padding: 16, paddingBottom: 80 },
  hero: { backgroundColor: Colors.rlpGreenDark, borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  heroKicker: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.rlpYellow, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 27, color: Colors.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant },
  statValue: { fontFamily: FontFamily.black, fontSize: 24, color: Colors.rlpGreen, marginTop: 8 },
  statLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  section: { marginTop: 22 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.white, marginBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  input: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, backgroundColor: Colors.surfaceContainerLow },
  inputMultiline: { minHeight: 78, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: Colors.rlpYellow, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
  outlineButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: Colors.rlpGreen, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: Colors.white },
  outlineButtonText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  row: { flexDirection: 'row', gap: 10 },
  preview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: Colors.surfaceContainerHigh },
  posterPreview: { width: '100%', aspectRatio: 3 / 4, borderRadius: 10, backgroundColor: Colors.surfaceContainerHigh },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: 4 },
  inlineSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  userInitial: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  userInitialText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.white },
  userBody: { flex: 1 },
  userName: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface },
  userMeta: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  switchGroup: { alignItems: 'center', gap: 2 },
  switchLabel: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.onSurfaceVariant },
  lockedState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white, marginTop: 14, marginBottom: 8 },
  lockedText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
});
