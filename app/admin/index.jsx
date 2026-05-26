import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getFriendlyApiErrorMessage, logApiError } from '../../services/api';
import {
  createBroadcastNotification,
  deleteNotification,
  getAdminContentSummary,
  getAdminOverview,
  getNotifications,
  updateNotification,
  updatePosterPlanSettings,
} from '../../services/admin.service';
import { useAuthStore } from '../../store/auth.store';
import { createPosterTemplate, deletePosterTemplate, getTemplates, updatePosterTemplate } from '../../services/poster.service';
import { createPadadhikari, deletePadadhikari, getPadadhikari, updatePadadhikari } from '../../services/padadhikari.service';
import { createTrainingVideo, deleteTrainingVideo, getTrainingVideos, updateTrainingVideo } from '../../services/videos.service';
import { createReel, deleteReel, getReels, updateReel } from '../../services/reels.service';
import SearchableDistrictSelect from '../../components/ui/SearchableDistrictSelect';
import { Colors } from '../../constants/colors';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { FontFamily } from '../../constants/typography';

const TABS = [
  { key: 'overview', label: 'Home', icon: 'grid' },
  { key: 'notify', label: 'Notify', icon: 'notifications' },
  { key: 'officials', label: 'Leaders', icon: 'ribbon' },
  { key: 'media', label: 'Media', icon: 'play-circle' },
  { key: 'posters', label: 'Posters', icon: 'color-palette' },
  { key: 'history', label: 'History', icon: 'time' },
];

const HISTORY_CATEGORIES = [
  { key: 'all', label: 'All', icon: 'albums' },
  { key: 'notifications', label: 'Notify', icon: 'notifications' },
  { key: 'officials', label: 'Leaders', icon: 'ribbon' },
  { key: 'reels', label: 'Status', icon: 'play-circle' },
  { key: 'trainings', label: 'Training', icon: 'videocam' },
  { key: 'templates', label: 'Posters', icon: 'color-palette' },
];

const OFFICIAL_LEVELS = [
  { label: 'State', value: 'state' },
  { label: 'District', value: 'district' },
  { label: 'Block', value: 'block' },
];

const emptyOfficial = { fullName: '', designation: '', rank: 'district', state: 'Rajasthan', district: '', block: '', phone: '', email: '', photoUri: '' };
const emptyTraining = { title: '', description: '', duration: '', language: 'Hindi', videoUri: '', thumbnailUri: '' };
const emptyReel = { caption: '', mediaUri: '', mediaType: 'image' };
const emptyTemplate = { name: '', category: 'Rally', imageUri: '', isPremium: true };
const emptyNotification = { title: 'RLP Suchna', body: '', priority: true };
const HISTORY_PAGE_SIZE = 8;
const DEFAULT_POSTER_CATEGORIES = ['Rally', 'Tyohaar', 'Shubhkamnayen', 'Leadership', 'Election 2024'];

function getOfficialLevelLabel(rank) {
  return OFFICIAL_LEVELS.find((item) => item.value === rank)?.label || 'District';
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, maxLength }) {
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
        maxLength={maxLength}
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

function MiniButton({ title, icon, onPress, danger }) {
  return (
    <Pressable style={({ pressed }) => [styles.miniButton, danger && styles.miniButtonDanger, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <Ionicons name={icon} size={14} color={danger ? Colors.error : Colors.rlpGreen} />
      <Text style={[styles.miniButtonText, danger && styles.miniButtonTextDanger]}>{title}</Text>
    </Pressable>
  );
}

function StatCard({ icon, label, value, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.statCard, pressed && onPress && { opacity: 0.82, transform: [{ scale: 0.99 }] }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.statIconRow}>
        <Ionicons name={icon} size={20} color={Colors.rlpGreen} />
        {onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.outline} /> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function pickCount(...values) {
  return values.find((value) => value !== null && value !== undefined) ?? 0;
}

function SelectField({ label, value, options, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value || item === value);
  const selectedLabel = typeof selected === 'string' ? selected : selected?.label;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectControl} onPress={() => setOpen((current) => !current)}>
        <Text style={[styles.selectValue, !selectedLabel && styles.selectPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder || `Select ${label}`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.onSurfaceVariant} />
      </Pressable>
      {open ? (
        <View style={styles.selectMenu}>
          <ScrollView nestedScrollEnabled style={styles.selectList}>
            {options.map((option) => {
              const optionLabel = typeof option === 'string' ? option : option.label;
              const optionValue = typeof option === 'string' ? option : option.value;
              const active = optionValue === value;
              return (
                <Pressable
                  key={optionValue}
                  style={[styles.selectOption, active && styles.selectOptionActive]}
                  onPress={() => {
                    onSelect(optionValue);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>{optionLabel}</Text>
                  {active ? <Ionicons name="checkmark" size={16} color={Colors.rlpGreen} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [price, setPrice] = useState('');
  const [downloadLimit, setDownloadLimit] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [editing, setEditing] = useState({});
  const [notification, setNotification] = useState(emptyNotification);
  const [official, setOfficial] = useState(emptyOfficial);
  const [training, setTraining] = useState(emptyTraining);
  const [reel, setReel] = useState(emptyReel);
  const [template, setTemplate] = useState(emptyTemplate);
  const [historyCategory, setHistoryCategory] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyVisibleCount, setHistoryVisibleCount] = useState(HISTORY_PAGE_SIZE);

  const canAccessAdmin =
    user?.role === 'admin'
    || user?.isAdmin
    || user?.email === 'admin@rlp.com'
    || user?.email?.endsWith('@rlpdigital.in');
  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getAdminOverview,
    enabled: canAccessAdmin,
    refetchInterval: 30000,
    refetchOnReconnect: true,
  });
  const { data: content, refetch: refetchContent } = useQuery({
    queryKey: ['admin-content'],
    queryFn: getAdminContentSummary,
    enabled: canAccessAdmin,
    refetchInterval: 30000,
    refetchOnReconnect: true,
  });
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({ queryKey: ['admin-notifications'], queryFn: getNotifications, enabled: canAccessAdmin });
  const { data: officials = [], refetch: refetchOfficials } = useQuery({ queryKey: ['admin-officials'], queryFn: () => getPadadhikari(), enabled: canAccessAdmin });
  const { data: reels = [], refetch: refetchReels } = useQuery({ queryKey: ['admin-reels'], queryFn: getReels, enabled: canAccessAdmin });
  const { data: trainings = [], refetch: refetchTrainings } = useQuery({ queryKey: ['admin-training'], queryFn: getTrainingVideos, enabled: canAccessAdmin });
  const { data: templates = [], refetch: refetchTemplates } = useQuery({ queryKey: ['admin-templates'], queryFn: () => getTemplates(), enabled: canAccessAdmin });
  const posterCategories = content?.posterCategories?.length ? content.posterCategories : DEFAULT_POSTER_CATEGORIES;

  useEffect(() => {
    if (!content) return;
    const nextPrice = String(content.subscriptionPrice ?? '');
    const nextDownloadLimit = String(content.monthlyTemplateDownloadLimit ?? '');
    const nextCategoryDraft = (content.posterCategories || []).join(', ');
    const allowedCategories = content.posterCategories?.length ? content.posterCategories : DEFAULT_POSTER_CATEGORIES;
    const fallbackCategory = allowedCategories[0] || DEFAULT_POSTER_CATEGORIES[0];

    setPrice((current) => (current === nextPrice ? current : nextPrice));
    setDownloadLimit((current) => (current === nextDownloadLimit ? current : nextDownloadLimit));
    setCategoryDraft((current) => (current === nextCategoryDraft ? current : nextCategoryDraft));
    setTemplate((current) => {
      const nextCategory = allowedCategories.includes(current.category) ? current.category : fallbackCategory;
      return nextCategory === current.category ? current : { ...current, category: nextCategory };
    });
  }, [content]);

  const stats = useMemo(() => overview ?? {}, [overview]);
  const historyItems = useMemo(() => {
    const normalizeDate = (item) => item.createdAt || item.updatedAt || item.date || item.issueDate || '';
    const items = [
      ...notifications.map((item) => ({
        ...item,
        historyType: 'notifications',
        historyIcon: item.priority ? 'alert-circle' : 'notifications',
        historyTitle: item.title || 'Notification',
        historyMeta: item.priority ? 'Priority notification' : 'Notification',
        historyText: item.body || item.message || '',
        historyDate: normalizeDate(item),
      })),
      ...officials.map((item) => ({
        ...item,
        historyType: 'officials',
        historyIcon: 'ribbon',
        historyTitle: item.fullName || item.name || 'Padadhikari',
        historyMeta: [getOfficialLevelLabel(item.rank), item.designation || item.role, item.district, item.block].filter(Boolean).join(' | '),
        historyText: [item.phone, item.email, item.rank].filter(Boolean).join(' | '),
        historyDate: normalizeDate(item),
      })),
      ...reels.map((item) => ({
        ...item,
        historyType: 'reels',
        historyIcon: item.mediaType === 'video' ? 'videocam' : 'image',
        historyTitle: item.caption || 'Status/Reel',
        historyMeta: `Status | ${item.mediaType || 'media'}`,
        historyText: item.description || item.caption || '',
        historyDate: normalizeDate(item),
      })),
      ...trainings.map((item) => ({
        ...item,
        historyType: 'trainings',
        historyIcon: 'videocam',
        historyTitle: item.title || 'Training Video',
        historyMeta: ['Training', item.language || 'Hindi', item.category].filter(Boolean).join(' | '),
        historyText: item.description || '',
        historyDate: normalizeDate(item),
      })),
      ...templates.map((item) => ({
        ...item,
        historyType: 'templates',
        historyIcon: 'color-palette',
        historyTitle: item.name || 'Poster Template',
        historyMeta: [item.category, item.isPremium ? 'Premium' : 'Free'].filter(Boolean).join(' | '),
        historyText: item.description || '',
        historyDate: normalizeDate(item),
      })),
    ];
    return items.sort((a, b) => new Date(b.historyDate || 0) - new Date(a.historyDate || 0));
  }, [notifications, officials, reels, trainings, templates]);
  const filteredHistory = useMemo(() => {
    const keyword = historySearch.trim().toLowerCase();
    const date = historyDate.trim();
    return historyItems.filter((item) => {
      const text = [item.historyTitle, item.historyMeta, item.historyText, item.title, item.body, item.message, item.caption, item.fullName, item.designation, item.district, item.block, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const parsedDate = item.historyDate ? new Date(item.historyDate) : null;
      const itemDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : '';
      const matchesCategory = historyCategory === 'all' || item.historyType === historyCategory;
      const matchesKeyword = !keyword || text.includes(keyword);
      const matchesDate = !date || itemDate === date;
      return matchesCategory && matchesKeyword && matchesDate;
    });
  }, [historyItems, historyCategory, historySearch, historyDate]);
  const visibleHistory = filteredHistory.slice(0, historyVisibleCount);

  async function pickMedia(kind, setter, key, mediaTypes = ImagePicker.MediaTypeOptions.Images) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission required', 'Please allow media library access.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes, allowsEditing: false, quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setter((prev) => ({
        ...prev,
        [key]: asset.uri,
        [`${key}Name`]: asset.fileName,
        [`${key}MimeType`]: asset.mimeType,
        ...(kind === 'reel' ? { mediaType: asset.type === 'video' ? 'video' : 'image' } : {}),
      }));
    }
  }

  const invalidatePublicData = () => {
    ['notifications', 'padadhikari-home', 'reels', 'training-videos', 'home-feed', 'subscription', 'templates'].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  const refreshCurrentTab = async () => {
    setRefreshing(true);
    const tasks = {
      overview: [refetchOverview, refetchContent, refetchNotifications, refetchOfficials, refetchReels, refetchTrainings, refetchTemplates],
      notify: [refetchNotifications],
      officials: [refetchOfficials, refetchContent, refetchOverview],
      media: [refetchReels, refetchTrainings, refetchOverview],
      posters: [refetchTemplates, refetchContent],
      history: [refetchNotifications, refetchOfficials, refetchReels, refetchTrainings, refetchTemplates, refetchContent, refetchOverview],
    };
    try {
      await Promise.all((tasks[tab] || []).map((task) => task()));
      invalidatePublicData();
    } catch (error) {
      logApiError(error, 'Admin refresh failed');
      Alert.alert('Refresh failed', getFriendlyApiErrorMessage(error, 'Admin data refresh nahi hua.'));
    } finally {
      setRefreshing(false);
    }
  };

  async function saveNotification() {
    if (!notification.title.trim() || !notification.body.trim()) return Alert.alert('Notification', 'Title aur message jaruri hai.');
    setSaving('notification');
    try {
      if (editing.notification) await updateNotification(editing.notification, notification);
      else await createBroadcastNotification(notification);
      setNotification(emptyNotification);
      setEditing((p) => ({ ...p, notification: null }));
      setHistoryVisibleCount(HISTORY_PAGE_SIZE);
      await Promise.all([refetchNotifications(), refetchOverview(), refetchContent()]);
      invalidatePublicData();
      Alert.alert('Done', 'Notification publish ho gayi.');
    } catch (error) {
      logApiError(error, 'Admin notification save failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Notification save nahi hui.'));
    } finally {
      setSaving('');
    }
  }

  async function saveOfficial() {
    if (!official.fullName.trim() || !official.designation.trim()) return Alert.alert('Padadhikari', 'Name aur designation jaruri hai.');
    if (!official.rank) return Alert.alert('Level', 'Level select karna jaruri hai.');
    if (!official.district.trim()) return Alert.alert('District', 'District select karna jaruri hai.');
    if (!isValidRajasthanDistrict(official.district)) return Alert.alert('District', 'District list me se valid Rajasthan district select kijiye.');
    if (official.rank === 'block' && !official.block.trim()) return Alert.alert('Block', 'Block name jaruri hai.');
    if (official.phone && official.phone.length !== 10) return Alert.alert('Phone', 'Phone number 10 digits ka hona chahiye.');
    setSaving('official');
    try {
      if (editing.official) await updatePadadhikari(editing.official, official);
      else await createPadadhikari(official);
      setOfficial(emptyOfficial);
      setEditing((p) => ({ ...p, official: null }));
      await Promise.all([refetchOfficials(), refetchOverview(), refetchContent()]);
      invalidatePublicData();
      Alert.alert('Done', 'Padadhikari save ho gaya.');
    } catch (error) {
      logApiError(error, 'Admin padadhikari save failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Padadhikari save nahi hua.'));
    } finally {
      setSaving('');
    }
  }

  async function saveTraining() {
    if (!training.title.trim() || (!editing.training && !training.videoUri)) return Alert.alert('Training', 'Title aur video jaruri hai.');
    setSaving('training');
    try {
      if (editing.training) await updateTrainingVideo(editing.training, training);
      else await createTrainingVideo(training);
      setTraining(emptyTraining);
      setEditing((p) => ({ ...p, training: null }));
      await Promise.all([refetchTrainings(), refetchOverview(), refetchContent()]);
      invalidatePublicData();
      Alert.alert('Done', 'Training video save ho gaya.');
    } catch (error) {
      logApiError(error, 'Admin training save failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Training save nahi hui.'));
    } finally {
      setSaving('');
    }
  }

  async function saveReel() {
    if (!editing.reel && !reel.mediaUri) return Alert.alert('Status/Reel', 'Image ya video select karna jaruri hai.');
    setSaving('reel');
    try {
      if (editing.reel) await updateReel(editing.reel, reel);
      else await createReel(reel);
      setReel(emptyReel);
      setEditing((p) => ({ ...p, reel: null }));
      await Promise.all([refetchReels(), refetchOverview(), refetchContent()]);
      invalidatePublicData();
      Alert.alert('Done', 'Status save ho gaya.');
    } catch (error) {
      logApiError(error, 'Admin status save failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Status save nahi hua.'));
    } finally {
      setSaving('');
    }
  }

  async function saveTemplate() {
    if (!template.name.trim() || !template.category.trim() || (!editing.template && !template.imageUri)) return Alert.alert('Template', 'Name, category aur image jaruri hai.');
    setSaving('template');
    try {
      if (editing.template) await updatePosterTemplate(editing.template, template);
      else await createPosterTemplate(template);
      setTemplate(emptyTemplate);
      setEditing((p) => ({ ...p, template: null }));
      await Promise.all([refetchTemplates(), refetchContent()]);
      invalidatePublicData();
      Alert.alert('Done', 'Template save ho gaya.');
    } catch (error) {
      logApiError(error, 'Admin poster template save failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Template save nahi hua.'));
    } finally {
      setSaving('');
    }
  }

  async function submitPrice() {
    const numericPrice = Number(price);
    if (!numericPrice || numericPrice < 1) return Alert.alert('Subscription', 'Valid monthly price dalein.');
    setSaving('price');
    try {
      await updatePosterPlanSettings({ price: numericPrice });
      await Promise.all([refetchContent(), refetchOverview()]);
      invalidatePublicData();
      Alert.alert('Done', 'Subscription price update ho gaya.');
    } catch (error) {
      logApiError(error, 'Admin subscription price update failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Price update nahi hua.'));
    } finally {
      setSaving('');
    }
  }

  async function submitDownloadLimit() {
    const numericLimit = Number(downloadLimit);
    if (!numericLimit || numericLimit < 1) return Alert.alert('Limit', 'Valid monthly download limit dalein.');
    setSaving('limit');
    try {
      await updatePosterPlanSettings({ monthlyDownloadLimit: numericLimit });
      await Promise.all([refetchContent(), refetchOverview()]);
      invalidatePublicData();
      Alert.alert('Done', 'Template download limit update ho gayi.');
    } catch (error) {
      logApiError(error, 'Admin poster download limit update failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Download limit update nahi hui.'));
    } finally {
      setSaving('');
    }
  }

  async function submitPosterCategories() {
    const categories = categoryDraft.split(',').map((item) => item.trim()).filter(Boolean);
    if (!categories.length) return Alert.alert('Categories', 'Kam se kam ek category jaruri hai.');
    setSaving('categories');
    try {
      await updatePosterPlanSettings({ categories });
      await Promise.all([refetchContent(), refetchTemplates()]);
      invalidatePublicData();
      setTemplate((current) => ({ ...current, category: categories.includes(current.category) ? current.category : categories[0] }));
      Alert.alert('Done', 'Poster categories update ho gayi.');
    } catch (error) {
      logApiError(error, 'Admin poster categories update failed');
      Alert.alert('Failed', getFriendlyApiErrorMessage(error, 'Poster categories update nahi hui.'));
    } finally {
      setSaving('');
    }
  }

  function confirmDelete(label, action) {
    Alert.alert('Delete', `${label} delete karna hai?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await action();
            await refreshCurrentTab();
            Alert.alert('Done', `${label} delete ho gaya.`);
          } catch (error) {
            logApiError(error, `Admin ${label} delete failed`);
            Alert.alert('Failed', getFriendlyApiErrorMessage(error, `${label} delete nahi hua.`));
          }
        },
      },
    ]);
  }

  function editHistoryItem(item) {
    if (item.historyType === 'notifications') {
      setEditing((p) => ({ ...p, notification: item.id }));
      setNotification({ title: item.title || '', body: item.body || item.message || '', priority: !!item.priority });
      setTab('notify');
      return;
    }
    if (item.historyType === 'officials') {
      setEditing((p) => ({ ...p, official: item.id }));
      setOfficial({ ...emptyOfficial, ...item, phone: item.phone ? String(item.phone).replace(/\D/g, '').slice(-10) : '' });
      setTab('officials');
      return;
    }
    if (item.historyType === 'reels') {
      setEditing((p) => ({ ...p, reel: item.id }));
      setReel({ ...emptyReel, caption: item.caption || '', mediaType: item.mediaType || 'image' });
      setTab('media');
      return;
    }
    if (item.historyType === 'trainings') {
      setEditing((p) => ({ ...p, training: item.id }));
      setTraining({ ...emptyTraining, ...item });
      setTab('media');
      return;
    }
    setEditing((p) => ({ ...p, template: item.id }));
    setTemplate({ ...emptyTemplate, name: item.name || '', category: item.category || posterCategories[0] || 'Rally', isPremium: !!item.isPremium });
    setTab('posters');
  }

  function deleteHistoryItem(item) {
    const actions = {
      notifications: { label: 'Notification', action: () => deleteNotification(item.id) },
      officials: { label: 'Padadhikari', action: () => deletePadadhikari(item.id) },
      reels: { label: 'Status', action: () => deleteReel(item.id) },
      trainings: { label: 'Training', action: () => deleteTrainingVideo(item.id) },
      templates: { label: 'Template', action: () => deletePosterTemplate(item.id) },
    };
    const config = actions[item.historyType];
    if (config) confirmDelete(config.label, config.action);
  }

  function renderRecentHistory(types, title) {
    const typeList = Array.isArray(types) ? types : [types];
    const recentItems = historyItems.filter((item) => typeList.includes(item.historyType)).slice(0, 5);
    const targetCategory = typeList.length === 1 ? typeList[0] : 'all';

    return (
      <View style={styles.recentHistoryBlock}>
        <View style={styles.recentHistoryHeader}>
          <Text style={styles.recentHistoryTitle}>{title}</Text>
        </View>
        {recentItems.length === 0 ? (
          <View style={styles.recentEmptyCard}>
            <Ionicons name="file-tray-outline" size={20} color={Colors.outline} />
            <Text style={styles.recentEmptyText}>Abhi koi history nahi hai</Text>
          </View>
        ) : recentItems.map((item) => {
          const parsedDate = item.historyDate ? new Date(item.historyDate) : null;
          const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : '';
          const category = HISTORY_CATEGORIES.find((entry) => entry.key === item.historyType);
          const recentMeta = (() => {
            if (item.historyType === 'notifications') return item.historyText || '';
            if (item.historyType === 'officials') return [getOfficialLevelLabel(item.rank), item.designation || item.historyMeta, item.district, item.block].filter(Boolean).join(' | ');
            if (item.historyType === 'reels' || item.historyType === 'trainings') return dateLabel || item.historyMeta || '';
            return [item.category || item.historyMeta, dateLabel].filter(Boolean).join(' | ');
          })();
          const tagLabel = item.historyType === 'notifications' || item.historyType === 'officials' ? dateLabel : (category?.label || 'Item');
          return (
            <Pressable key={`recent-${item.historyType}-${item.id}`} style={styles.recentHistoryCard} onPress={() => editHistoryItem(item)}>
              <View style={styles.recentHistoryIcon}>
                <Ionicons name={item.historyIcon} size={15} color={item.priority ? Colors.error : Colors.rlpGreen} />
              </View>
              <View style={styles.recentHistoryBody}>
                <Text style={styles.recentHistoryItemTitle} numberOfLines={1}>{item.historyTitle}</Text>
                {recentMeta ? <Text style={styles.recentHistoryMeta} numberOfLines={1}>{recentMeta}</Text> : null}
              </View>
              <View style={styles.recentHistoryRight}>
                {tagLabel ? <Text style={[styles.recentTypeBadge, (item.historyType === 'notifications' || item.historyType === 'officials') && styles.recentDateOnly]} numberOfLines={1}>{tagLabel}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
              </View>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.seeMoreHistoryButton}
          onPress={() => {
            setHistoryCategory(targetCategory);
            setHistoryVisibleCount(HISTORY_PAGE_SIZE);
            setTab('history');
          }}
        >
          <View style={styles.seeMoreHistoryIcon}>
            <Ionicons name="time" size={14} color={Colors.rlpGreenDark} />
          </View>
          <Text style={styles.seeMoreHistoryText}>See more history</Text>
          <Ionicons name="arrow-forward-circle" size={18} color={Colors.rlpGreenDark} />
        </Pressable>
      </View>
    );
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} tintColor={Colors.rlpYellow} colors={[Colors.rlpGreen]} />}
      >
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.adminIcon}>
              <Ionicons name="shield-checkmark" size={19} color={Colors.rlpGreenDark} />
            </View>
            <Text style={styles.headerTitle}>RLP Admin</Text>
          </View>
          <Pressable style={styles.exitButton} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="exit-outline" size={18} color="#9F1F17" />
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
        {tab === 'overview' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroKicker}>RLP Admin Panel</Text>
              <Text style={styles.heroTitle}>Users, content, notifications aur party updates ek jagah se manage karein.</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard icon="people" label="Users" value={pickCount(stats.users, stats.totalUsers)} />
              <StatCard icon="id-card" label="Subscribers" value={pickCount(stats.activeSubscriptions)} />
              <StatCard icon="ribbon" label="Padadhikari" value={pickCount(officials.length, content?.officials, stats.totalPadadhikari)} onPress={() => setTab('officials')} />
              <StatCard icon="play-circle" label="Reels/Status" value={pickCount(reels.length, content?.reels, stats.reels)} onPress={() => setTab('media')} />
              <StatCard icon="videocam" label="Training Videos" value={pickCount(trainings.length, content?.trainingVideos, stats.trainingVideos)} onPress={() => setTab('media')} />
              <StatCard icon="notifications" label="Notifications" value={pickCount(notifications.length, content?.notifications, stats.notifications)} onPress={() => setTab('notify')} />
              <StatCard icon="time" label="All History" value={historyItems.length} onPress={() => setTab('history')} />
            </View>
          </>
        )}

        {tab === 'notify' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{editing.notification ? 'Edit Notification' : 'Create Notification'}</Text>
            <View style={styles.card}>
              <Field label="Title" value={notification.title} onChangeText={(v) => setNotification((p) => ({ ...p, title: v }))} />
              <Field label="Message" value={notification.body} onChangeText={(v) => setNotification((p) => ({ ...p, body: v }))} multiline />
              <View style={styles.inlineSwitch}><Text style={styles.fieldLabel}>Priority</Text><Switch value={notification.priority} onValueChange={(v) => setNotification((p) => ({ ...p, priority: v }))} /></View>
              <PrimaryButton title={editing.notification ? 'Update Notification' : 'Send Notification'} icon="notifications" onPress={saveNotification} loading={saving === 'notification'} />
            </View>
            {renderRecentHistory('notifications', 'Recent Notification History')}
          </View>
        )}

        {tab === 'officials' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{editing.official ? 'Edit Padadhikari' : 'Add Padadhikari'}</Text>
            <View style={styles.card}>
              <Field label="Full Name" value={official.fullName} onChangeText={(v) => setOfficial((p) => ({ ...p, fullName: v }))} />
              <Field label="Designation" value={official.designation} onChangeText={(v) => setOfficial((p) => ({ ...p, designation: v }))} />
              <SelectField
                label="Level"
                value={official.rank}
                options={OFFICIAL_LEVELS}
                onSelect={(value) => setOfficial((p) => ({ ...p, rank: value, block: value === 'block' ? p.block : '' }))}
              />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>District</Text>
                <SearchableDistrictSelect
                  value={official.district}
                  onSelect={(value) => setOfficial((p) => ({ ...p, district: value }))}
                  placeholder="District search karke select karein"
                />
              </View>
              {official.rank === 'block' ? (
                <Field label="Block" value={official.block} onChangeText={(v) => setOfficial((p) => ({ ...p, block: v }))} />
              ) : null}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <View style={styles.phoneInputWrap}>
                  <View style={styles.phonePrefixBox}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={official.phone}
                    onChangeText={(v) => setOfficial((p) => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10 digit mobile number"
                    placeholderTextColor={Colors.outline}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              </View>
              <View style={styles.photoPickRow}>
                <Pressable style={[styles.outlineButton, styles.photoPickButton]} onPress={() => pickMedia('official', setOfficial, 'photoUri')}>
                  <Ionicons name="image" size={18} color={Colors.rlpGreen} />
                  <Text style={styles.outlineButtonText}>Pick Photo</Text>
                </Pressable>
                <View style={styles.selectedPhotoBox}>
                  {official.photoUri || official.photoUrl ? (
                    <>
                      <Image source={{ uri: official.photoUri || official.photoUrl }} style={styles.selectedPhoto} resizeMode="cover" />
                      <View style={styles.selectedPhotoBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={Colors.white} />
                        <Text style={styles.selectedPhotoText}>Selected</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.photoEmptyState}>
                      <Ionicons name="image-outline" size={22} color={Colors.outline} />
                      <Text style={styles.photoEmptyText}>No photo</Text>
                    </View>
                  )}
                </View>
              </View>
              <PrimaryButton title={editing.official ? 'Update Padadhikari' : 'Add Padadhikari'} icon="add-circle" onPress={saveOfficial} loading={saving === 'official'} />
            </View>
            {renderRecentHistory('officials', 'Recent Padadhikari History')}
          </View>
        )}

        {tab === 'media' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{editing.reel ? 'Edit Status/Reel' : 'Party Work Status/Reel'}</Text>
            <View style={styles.card}>
              <Field label="Caption" value={reel.caption} onChangeText={(v) => setReel((p) => ({ ...p, caption: v }))} multiline />
              <Pressable style={styles.outlineButton} onPress={() => pickMedia('reel', setReel, 'mediaUri', ImagePicker.MediaTypeOptions.All)}><Ionicons name="albums" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>Pick Image/Video</Text></Pressable>
              {reel.mediaUri ? (
                <View style={styles.compactMediaBox}>
                  {reel.mediaType === 'image' ? (
                    <Image source={{ uri: reel.mediaUri }} style={styles.compactMediaImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.compactVideoIcon}>
                      <Ionicons name="videocam" size={22} color={Colors.white} />
                    </View>
                  )}
                  <View style={styles.compactMediaBody}>
                    <Text style={styles.compactMediaTitle}>{reel.mediaType === 'video' ? 'Video selected' : 'Image selected'}</Text>
                    <Text style={styles.compactMediaMeta} numberOfLines={1}>{reel.mediaUriName || 'Ready to upload'}</Text>
                  </View>
                  <View style={styles.compactCheckIcon}>
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  </View>
                </View>
              ) : null}
              <PrimaryButton title={editing.reel ? 'Update Status' : 'Upload Status'} icon="play-circle" onPress={saveReel} loading={saving === 'reel'} />
            </View>
            <Text style={styles.sectionTitle}>Training Video</Text>
            <View style={styles.card}>
              <Field label="Title" value={training.title} onChangeText={(v) => setTraining((p) => ({ ...p, title: v }))} />
              <Field label="Description" value={training.description} onChangeText={(v) => setTraining((p) => ({ ...p, description: v }))} multiline />
              <View style={styles.row}>
                <Pressable style={styles.outlineButton} onPress={() => pickMedia('training', setTraining, 'videoUri', ImagePicker.MediaTypeOptions.Videos)}><Ionicons name="videocam" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>Video</Text></Pressable>
                <Pressable style={styles.outlineButton} onPress={() => pickMedia('training', setTraining, 'thumbnailUri')}><Ionicons name="image" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>Thumbnail</Text></Pressable>
              </View>
              {(training.videoUri || training.thumbnailUri) ? (
                <View style={styles.trainingPreviewGrid}>
                  {training.videoUri ? (
                    <View style={styles.compactMediaBox}>
                      <View style={styles.compactVideoIcon}>
                        <Ionicons name="videocam" size={22} color={Colors.white} />
                      </View>
                      <View style={styles.compactMediaBody}>
                        <Text style={styles.compactMediaTitle}>Video selected</Text>
                        <Text style={styles.compactMediaMeta} numberOfLines={1}>{training.videoUriName || 'Ready to upload'}</Text>
                      </View>
                      <View style={styles.compactCheckIcon}>
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      </View>
                    </View>
                  ) : null}
                  {training.thumbnailUri ? (
                    <View style={styles.compactMediaBox}>
                      <Image source={{ uri: training.thumbnailUri }} style={styles.compactMediaImage} resizeMode="cover" />
                      <View style={styles.compactMediaBody}>
                        <Text style={styles.compactMediaTitle}>Thumbnail selected</Text>
                        <Text style={styles.compactMediaMeta} numberOfLines={1}>{training.thumbnailUriName || 'Ready to upload'}</Text>
                      </View>
                      <View style={styles.compactCheckIcon}>
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <PrimaryButton title={editing.training ? 'Update Training' : 'Upload Training'} icon="cloud-upload" onPress={saveTraining} loading={saving === 'training'} />
            </View>
            {renderRecentHistory(['reels', 'trainings'], 'Recent Media History')}
          </View>
        )}

        {tab === 'posters' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Poster Plan</Text>
            <View style={styles.card}>
              <Field label={`Monthly Price (current Rs ${content?.subscriptionPrice ?? 99})`} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Example: 99" />
              <PrimaryButton title="Update Plan Price" icon="cash" onPress={submitPrice} loading={saving === 'price'} />
            </View>
            <View style={styles.card}>
              <Field label={`Template Download Limit (current ${content?.monthlyTemplateDownloadLimit ?? 30})`} value={downloadLimit} onChangeText={setDownloadLimit} keyboardType="numeric" placeholder="Example: 30" />
              <PrimaryButton title="Update Download Limit" icon="download" onPress={submitDownloadLimit} loading={saving === 'limit'} />
            </View>
            <View style={styles.card}>
              <Field label="Poster Categories" value={categoryDraft} onChangeText={setCategoryDraft} placeholder="Rally, Tyohaar, Shubhkamnayen" />
              <Text style={styles.helperLabel}>Comma se categories separate karein. Yehi user ko category chips aur admin dropdown me dikhenge.</Text>
              <PrimaryButton title="Update Categories" icon="list" onPress={submitPosterCategories} loading={saving === 'categories'} />
            </View>
            <Text style={styles.sectionTitle}>{editing.template ? 'Edit Template' : 'Upload Template'}</Text>
            <View style={styles.card}>
              <Field label="Template Name" value={template.name} onChangeText={(v) => setTemplate((p) => ({ ...p, name: v }))} />
              <SelectField label="Category" value={template.category} options={posterCategories} onSelect={(v) => setTemplate((p) => ({ ...p, category: v }))} placeholder="Select category" />
              <View style={styles.inlineSwitch}><Text style={styles.fieldLabel}>Premium Template</Text><Switch value={template.isPremium} onValueChange={(v) => setTemplate((p) => ({ ...p, isPremium: v }))} /></View>
              <Pressable style={styles.outlineButton} onPress={() => pickMedia('template', setTemplate, 'imageUri')}><Ionicons name="image" size={18} color={Colors.rlpGreen} /><Text style={styles.outlineButtonText}>Pick Template Image</Text></Pressable>
              {template.imageUri ? (
                <View style={styles.compactMediaBox}>
                  <Image source={{ uri: template.imageUri }} style={styles.compactMediaImage} resizeMode="cover" />
                  <View style={styles.compactMediaBody}>
                    <Text style={styles.compactMediaTitle}>Template selected</Text>
                    <Text style={styles.compactMediaMeta} numberOfLines={1}>{template.imageUriName || 'Ready to upload'}</Text>
                  </View>
                  <View style={styles.compactCheckIcon}>
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  </View>
                </View>
              ) : null}
              <PrimaryButton title={editing.template ? 'Update Template' : 'Upload Template'} icon="cloud-upload" onPress={saveTemplate} loading={saving === 'template'} />
            </View>
            {renderRecentHistory('templates', 'Recent Poster History')}
          </View>
        )}

        {tab === 'history' && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>Content History</Text>
                <Text style={styles.historyMeta}>{filteredHistory.length} of {historyItems.length} records</Text>
              </View>
              {(historySearch || historyDate || historyCategory !== 'all') ? (
                <Pressable
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setHistoryCategory('all');
                    setHistorySearch('');
                    setHistoryDate('');
                    setHistoryVisibleCount(HISTORY_PAGE_SIZE);
                  }}
                >
                  <Text style={styles.clearFilterText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {HISTORY_CATEGORIES.map((category) => {
                  const isActive = historyCategory === category.key;
                  const count = category.key === 'all' ? historyItems.length : historyItems.filter((item) => item.historyType === category.key).length;
                  return (
                    <Pressable
                      key={category.key}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => {
                        setHistoryCategory(category.key);
                        setHistoryVisibleCount(HISTORY_PAGE_SIZE);
                      }}
                    >
                      <Ionicons name={category.icon} size={14} color={isActive ? Colors.onSurface : Colors.rlpGreen} />
                      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>{category.label}</Text>
                      <Text style={[styles.categoryCount, isActive && styles.categoryCountActive]}>{count}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.searchField}>
                <Ionicons name="search" size={17} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.searchInput}
                  value={historySearch}
                  onChangeText={(value) => {
                    setHistorySearch(value);
                    setHistoryVisibleCount(HISTORY_PAGE_SIZE);
                  }}
                  placeholder="Search name, title, message, district, category"
                  placeholderTextColor={Colors.outline}
                />
              </View>
              <View style={styles.searchField}>
                <Ionicons name="calendar" size={17} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.searchInput}
                  value={historyDate}
                  onChangeText={(value) => {
                    setHistoryDate(value);
                    setHistoryVisibleCount(HISTORY_PAGE_SIZE);
                  }}
                  placeholder="Filter by date: YYYY-MM-DD"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {visibleHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="file-tray-outline" size={28} color={Colors.outline} />
                <Text style={styles.emptyHistoryText}>No history found</Text>
              </View>
            ) : visibleHistory.map((item) => {
              const parsedDate = item.historyDate ? new Date(item.historyDate) : null;
              const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                : '';
              const category = HISTORY_CATEGORIES.find((entry) => entry.key === item.historyType);
              const detailText = item.historyType === 'notifications' ? item.historyText : item.historyMeta;
              const extraText = item.historyType === 'notifications' ? '' : item.historyText;
              const tagText = item.priority ? 'Priority' : (category?.label || 'Item');
              return (
                <View key={`${item.historyType}-${item.id}`} style={styles.notificationHistoryCard}>
                  <View style={styles.notificationHistoryTop}>
                    <View style={styles.notificationIcon}>
                      <Ionicons name={item.historyIcon} size={18} color={item.priority ? Colors.error : Colors.rlpGreen} />
                    </View>
                    <View style={styles.notificationBody}>
                      <Text style={styles.historyCardTitle} numberOfLines={1}>{item.historyTitle}</Text>
                      {detailText ? <Text style={styles.historyCardMeta} numberOfLines={1}>{detailText}</Text> : null}
                      {extraText ? <Text style={styles.historyCardText} numberOfLines={1}>{extraText}</Text> : null}
                    </View>
                    <View style={styles.historyCardSide}>
                      {dateLabel ? <Text style={styles.notificationDate}>{dateLabel}</Text> : null}
                      <Text style={[styles.typeBadge, item.priority && styles.priorityBadge]} numberOfLines={1}>{tagText}</Text>
                    </View>
                  </View>
                  <View style={styles.historyActionRow}>
                    <MiniButton title="Edit" icon="create" onPress={() => editHistoryItem(item)} />
                    <MiniButton title="Delete" icon="trash" danger onPress={() => deleteHistoryItem(item)} />
                  </View>
                </View>
              );
            })}

            {filteredHistory.length > historyVisibleCount ? (
              <Pressable
                style={styles.loadMoreButton}
                onPress={() => setHistoryVisibleCount((count) => count + HISTORY_PAGE_SIZE)}
              >
                <Text style={styles.loadMoreText}>Show more</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.rlpGreen} />
              </Pressable>
            ) : null}
          </View>
        )}
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        {TABS.map((item) => (
          <Pressable key={item.key} style={[styles.navItem, tab === item.key && styles.navItemActive]} onPress={() => setTab(item.key)}>
            <Ionicons name={item.icon} size={21} color={tab === item.key ? Colors.rlpGreen : Colors.onSurfaceVariant} />
            <Text style={[styles.navText, tab === item.key && styles.navTextActive]} numberOfLines={1}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.rlpGreen },
  scrollContent: { paddingBottom: 76 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.rlpGreenDark, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)' },
  iconButton: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.rlpYellow, borderWidth: 1, borderColor: 'rgba(0,110,46,0.18)' },
  exitButton: { minWidth: 68, height: 36, borderRadius: 18, backgroundColor: '#FDE7E4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E7A09A' },
  exitText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#9F1F17' },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white },
  content: { padding: 16 },
  hero: { backgroundColor: Colors.rlpGreenDark, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  heroKicker: { fontFamily: FontFamily.black, fontSize: 20, color: Colors.rlpYellow, marginBottom: 6 },
  heroTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.9)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant },
  statIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontFamily: FontFamily.black, fontSize: 24, color: Colors.rlpGreen, marginTop: 8 },
  statLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.white, marginTop: 8 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant, gap: 12, marginBottom: 8 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  helperLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16 },
  input: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, backgroundColor: Colors.surfaceContainerLow },
  inputMultiline: { minHeight: 78, textAlignVertical: 'top' },
  selectControl: { minHeight: 44, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 12, backgroundColor: Colors.surfaceContainerLow, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  selectValue: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface },
  selectPlaceholder: { color: Colors.outline },
  selectSearchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, paddingVertical: 10 },
  selectMenu: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, backgroundColor: Colors.white, overflow: 'hidden' },
  selectList: { maxHeight: 190 },
  selectOption: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  selectOptionActive: { backgroundColor: Colors.primaryContainer },
  selectOptionText: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.onSurface },
  selectOptionTextActive: { fontFamily: FontFamily.bold, color: Colors.rlpGreen },
  phoneInputWrap: { minHeight: 44, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, backgroundColor: Colors.surfaceContainerLow, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  phonePrefixBox: { alignSelf: 'stretch', minWidth: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryContainer, borderRightWidth: 1, borderRightColor: Colors.outlineVariant },
  phonePrefixText: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.rlpGreenDark },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface },
  primaryButton: { backgroundColor: Colors.rlpYellow, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
  outlineButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: Colors.rlpGreen, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: Colors.white },
  outlineButtonText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  row: { flexDirection: 'row', gap: 10 },
  preview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: Colors.surfaceContainerHigh },
  trainingPreviewGrid: { gap: 8 },
  compactMediaBox: { minHeight: 58, borderRadius: 10, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden', alignItems: 'center', flexDirection: 'row' },
  compactMediaImage: { width: 58, height: 58, backgroundColor: Colors.surfaceContainerHigh },
  compactVideoIcon: { width: 58, height: 58, backgroundColor: Colors.rlpGreenDark, alignItems: 'center', justifyContent: 'center' },
  compactMediaBody: { flex: 1, paddingHorizontal: 10 },
  compactMediaTitle: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.onSurface },
  compactMediaMeta: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  compactCheckIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  photoPickRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  photoPickButton: { height: 74 },
  selectedPhotoBox: { width: 94, height: 74, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  selectedPhoto: { width: 94, height: 74 },
  selectedPhotoBadge: { position: 'absolute', left: 6, right: 6, bottom: 6, minHeight: 22, borderRadius: 11, backgroundColor: 'rgba(0,110,46,0.88)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  selectedPhotoText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.white },
  photoEmptyState: { alignItems: 'center', gap: 4 },
  photoEmptyText: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.onSurfaceVariant },
  inlineSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortcutRow: { flexDirection: 'row', gap: 10 },
  historyShortcut: { minHeight: 44, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  historyShortcutHalf: { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 10 },
  historyShortcutText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.rlpGreen },
  recentHistoryBlock: { gap: 8, marginTop: 2 },
  recentHistoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentHistoryTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
  recentHistoryCount: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  recentHistoryCard: { minHeight: 56, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  recentHistoryIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  recentHistoryBody: { flex: 1 },
  recentHistoryItemTitle: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.onSurface },
  recentHistoryMeta: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  recentHistoryRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 5, maxWidth: 74 },
  recentTypeBadge: { fontFamily: FontFamily.bold, fontSize: 8, color: Colors.rlpGreen, backgroundColor: Colors.primaryContainer, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
  recentDateOnly: { color: Colors.onSurfaceVariant, backgroundColor: 'transparent', paddingHorizontal: 0 },
  recentEmptyCard: { minHeight: 54, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  recentEmptyText: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant },
  seeMoreHistoryButton: { minHeight: 50, borderRadius: 12, backgroundColor: Colors.primaryContainer, borderWidth: 1.5, borderColor: Colors.rlpGreenDark, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, elevation: 5, shadowColor: Colors.rlpGreenDark, shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  seeMoreHistoryIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  seeMoreHistoryText: { fontFamily: FontFamily.black, fontSize: 15, color: Colors.rlpGreenDark },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  historyTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.white },
  historyMeta: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.74)', marginTop: 2 },
  clearFilterButton: { minHeight: 32, borderRadius: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  clearFilterText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.white },
  filterCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.outlineVariant, gap: 10 },
  categoryRow: { gap: 8, paddingRight: 4 },
  categoryChip: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant },
  categoryChipActive: { backgroundColor: Colors.rlpYellow, borderColor: Colors.rlpYellow },
  categoryChipText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.rlpGreen },
  categoryChipTextActive: { color: Colors.onSurface },
  categoryCount: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.onSurfaceVariant, backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
  categoryCountActive: { color: Colors.rlpGreen },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 10, minHeight: 42, backgroundColor: Colors.surfaceContainerLow },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurface, paddingVertical: 8 },
  emptyHistory: { backgroundColor: Colors.white, borderRadius: 12, padding: 22, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  emptyHistoryText: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.onSurfaceVariant },
  notificationHistoryCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Colors.outlineVariant, gap: 8 },
  notificationHistoryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  notificationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  notificationBody: { flex: 1 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyItemTitle: { flex: 1 },
  historyCardTitle: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.onSurface },
  historyCardMeta: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  historyCardText: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  historyCardSide: { width: 68, alignItems: 'flex-end', gap: 5 },
  priorityBadge: { color: Colors.error, backgroundColor: '#FDE7E4' },
  typeBadge: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.rlpGreen, backgroundColor: Colors.primaryContainer, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden', maxWidth: 68 },
  notificationDate: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.onSurfaceVariant },
  loadMoreButton: { minHeight: 42, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  loadMoreText: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.rlpGreen },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  userInitial: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  userInitialText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.white },
  userBody: { flex: 1 },
  userName: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurface },
  userMeta: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  switchGroup: { alignItems: 'center', gap: 2 },
  switchLabel: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.onSurfaceVariant },
  listCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.outlineVariant, gap: 6 },
  listTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
  listMeta: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  historyActionRow: { flexDirection: 'row', gap: 8 },
  miniButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: Colors.rlpGreen, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  miniButtonDanger: { borderColor: Colors.error },
  miniButtonText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.rlpGreen },
  miniButtonTextDanger: { color: Colors.error },
  lockedState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white, marginTop: 14, marginBottom: 8 },
  lockedText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  bottomNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingTop: 8, paddingBottom: 10, paddingHorizontal: 6, elevation: 10 },
  navItem: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, gap: 3, marginHorizontal: 2 },
  navItemActive: { backgroundColor: Colors.primaryContainer },
  navText: { fontFamily: FontFamily.medium, fontSize: 9, color: Colors.onSurfaceVariant },
  navTextActive: { fontFamily: FontFamily.bold, color: Colors.rlpGreen },
});
