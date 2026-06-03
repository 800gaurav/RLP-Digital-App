import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import SearchableDistrictSelect from '../ui/SearchableDistrictSelect';
import { Colors } from '../../constants/colors';
import { isValidRajasthanDistrict } from '../../constants/rajasthanDistricts';
import { FontFamily } from '../../constants/typography';
import { getFriendlyErrorMessage } from '../../services/api';
import { isPermissionDeniedError, showPermissionSettingsAlert } from '../../src/services/PermissionManager';
import { savePosterToGallery } from '../../src/utils/mediaSave';
import {
  buildDefaultPosterCustomization,
  loadPosterCustomization,
  normalizePosterCustomization,
  savePosterCustomization,
} from '../../services/poster-customization.storage';
import { getUserProfilePhoto } from '../../services/media';

const CAPTURE_WIDTH = 1080;
const CAPTURE_POSTER_HEIGHT = 1440;
const POSTER_PREVIEW_MAX_WIDTH = 360;
const LOCATION_LINE_MAX_LENGTH_WITH_CONTACT = 30;
const PHOTO_PICKER_QUALITY = 0.68;
const POSTER_PHOTO_DIRECTORY = `${FileSystem.documentDirectory || FileSystem.cacheDirectory || ''}poster-photos`;
const DEFAULT_LAYOUT_ID = 'circle-card';
const DEFAULT_DESIGNATION = 'आरएलपी कार्यकर्ता';
const PARTY_NAME_HI = 'राष्ट्रीय लोकतांत्रिक पार्टी';
const FALLBACK_PROFILE_CONTENT = {
  name: 'आरएलपी सदस्य',
};

const DISTRICT_HI_MAP = {
  Ajmer: 'अजमेर',
  Alwar: 'अलवर',
  Anupgarh: 'अनूपगढ़',
  Balotra: 'बालोतरा',
  Banswara: 'बांसवाड़ा',
  Baran: 'बारां',
  Barmer: 'बाड़मेर',
  Beawar: 'ब्यावर',
  Bharatpur: 'भरतपुर',
  Bhilwara: 'भीलवाड़ा',
  Bikaner: 'बीकानेर',
  Bundi: 'बूंदी',
  Chittorgarh: 'चित्तौड़गढ़',
  Churu: 'चूरू',
  Dausa: 'दौसा',
  Deeg: 'डीग',
  Dholpur: 'धौलपुर',
  'Didwana-Kuchaman': 'डीडवाना-कुचामन',
  Dudu: 'दूदू',
  Dungarpur: 'डूंगरपुर',
  Ganganagar: 'गंगानगर',
  'Gangapur City': 'गंगापुर सिटी',
  Hanumangarh: 'हनुमानगढ़',
  Jaipur: 'जयपुर',
  'Jaipur Rural': 'जयपुर ग्रामीण',
  Jaisalmer: 'जैसलमेर',
  Jalore: 'जालोर',
  Jhalawar: 'झालावाड़',
  Jhunjhunu: 'झुंझुनू',
  Jodhpur: 'जोधपुर',
  'Jodhpur Rural': 'जोधपुर ग्रामीण',
  Karauli: 'करौली',
  Kekri: 'केकड़ी',
  'Khairthal-Tijara': 'खैरथल-तिजारा',
  Kota: 'कोटा',
  'Kotputli-Behror': 'कोटपूतली-बहरोड़',
  Nagaur: 'नागौर',
  'Neem Ka Thana': 'नीम का थाना',
  Pali: 'पाली',
  Phalodi: 'फलोदी',
  Pratapgarh: 'प्रतापगढ़',
  Rajsamand: 'राजसमंद',
  Salumbar: 'सलूंबर',
  Sanchore: 'सांचौर',
  'Sawai Madhopur': 'सवाई माधोपुर',
  Shahpura: 'शाहपुरा',
  Sikar: 'सीकर',
  Sirohi: 'सिरोही',
  Tonk: 'टोंक',
  Udaipur: 'उदयपुर',
};

const HINDI_WORD_MAP = {
  adhyaksh: 'अध्यक्ष',
  adhikari: 'अधिकारी',
  block: 'ब्लॉक',
  booth: 'बूथ',
  choudhary: 'चौधरी',
  chaudhary: 'चौधरी',
  chouhan: 'चौहान',
  coordinator: 'संयोजक',
  digamber: 'दिगम्बर',
  digmber: 'दिगम्बर',
  district: 'जिला',
  facebook: 'फेसबुक',
  general: 'महासचिव',
  hanuman: 'हनुमान',
  incharge: 'प्रभारी',
  karyakarta: 'कार्यकर्ता',
  kumar: 'कुमार',
  lal: 'लाल',
  loktantrik: 'लोकतांत्रिक',
  mandal: 'मंडल',
  media: 'मीडिया',
  member: 'सदस्य',
  morcha: 'मोर्चा',
  nirdeshak: 'निर्देशक',
  panchayat: 'पंचायत',
  party: 'पार्टी',
  padadhikari: 'पदाधिकारी',
  padadhikariyon: 'पदाधिकारियों',
  prabhari: 'प्रभारी',
  pradhan: 'प्रधान',
  pradesh: 'प्रदेश',
  president: 'अध्यक्ष',
  pramukh: 'प्रमुख',
  ram: 'राम',
  rlp: 'आरएलपी',
  rashtriya: 'राष्ट्रीय',
  sachiv: 'सचिव',
  samiti: 'समिति',
  sanyojak: 'संयोजक',
  secretary: 'सचिव',
  social: 'सोशल',
  singh: 'सिंह',
  state: 'प्रदेश',
  vidhansabha: 'विधानसभा',
  vidhan: 'विधान',
  sabha: 'सभा',
  wing: 'विंग',
  yuva: 'युवा',
};

const HINDI_DIGRAPHS = {
  ksh: 'क्ष',
  gya: 'ज्ञ',
  tra: 'त्र',
  shr: 'श्र',
  chh: 'छ',
  kh: 'ख',
  gh: 'घ',
  ch: 'च',
  jh: 'झ',
  th: 'थ',
  dh: 'ध',
  ph: 'फ',
  bh: 'भ',
  sh: 'श',
};

const HINDI_CONSONANTS = {
  k: 'क',
  g: 'ग',
  c: 'क',
  j: 'ज',
  t: 'त',
  d: 'द',
  n: 'न',
  p: 'प',
  b: 'ब',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  s: 'स',
  h: 'ह',
  f: 'फ',
  q: 'क',
  z: 'ज',
  x: 'क्स',
};

const HINDI_INDEPENDENT_VOWELS = {
  a: 'अ',
  aa: 'आ',
  i: 'इ',
  ee: 'ई',
  ii: 'ई',
  e: 'ए',
  ai: 'ऐ',
  o: 'ओ',
  oo: 'ऊ',
  uu: 'ऊ',
  u: 'उ',
  au: 'औ',
};

const HINDI_VOWEL_SIGNS = {
  a: '',
  aa: 'ा',
  i: 'ि',
  ee: 'ी',
  ii: 'ी',
  e: 'े',
  ai: 'ै',
  o: 'ो',
  oo: 'ू',
  uu: 'ू',
  u: 'ु',
  au: 'ौ',
};

const THEME_OPTIONS = [
  {
    id: 'classic-red',
    label: 'Classic Red',
    barBackground: '#FFFFFF',
    leftBackground: '#FFF4EA',
    primaryText: '#B91C1C',
    secondaryText: '#1F2937',
    mutedText: '#4B5563',
    accent: '#F15A24',
    accentDark: '#B91C1C',
    stripeColors: ['#F97316', '#FFFFFF', '#F6D21A'],
    photoBackground: '#E5E7EB',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'desert-saffron',
    label: 'Desert Saffron',
    barBackground: '#FFF3E0',
    leftBackground: '#FFE0B2',
    primaryText: '#9A3412',
    secondaryText: '#431407',
    mutedText: '#7C2D12',
    accent: '#EA580C',
    accentDark: '#9A3412',
    stripeColors: ['#EA580C', '#FFF7ED', '#FACC15'],
    photoBackground: '#FED7AA',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'marwar-green',
    label: 'Marwar Green',
    barBackground: '#F0FDF4',
    leftBackground: '#DCFCE7',
    primaryText: '#166534',
    secondaryText: '#052E16',
    mutedText: '#166534',
    accent: '#16A34A',
    accentDark: '#14532D',
    stripeColors: ['#F97316', '#FFFFFF', '#16A34A'],
    photoBackground: '#BBF7D0',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'royal-cream',
    label: 'Royal Cream',
    barBackground: '#FFF8E7',
    leftBackground: '#FDE68A',
    primaryText: '#7C2D12',
    secondaryText: '#422006',
    mutedText: '#854D0E',
    accent: '#D97706',
    accentDark: '#92400E',
    stripeColors: ['#D97706', '#FFF8E7', '#047857'],
    photoBackground: '#FEF3C7',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'midnight-gold',
    label: 'Midnight Gold',
    barBackground: '#0F172A',
    leftBackground: '#1E293B',
    primaryText: '#FACC15',
    secondaryText: '#F8FAFC',
    mutedText: '#CBD5E1',
    accent: '#F59E0B',
    accentDark: '#FACC15',
    stripeColors: ['#F59E0B', '#F8FAFC', '#16A34A'],
    photoBackground: '#334155',
    photoBorder: '#FACC15',
  },
  {
    id: 'charcoal-red',
    label: 'Charcoal Red',
    barBackground: '#18181B',
    leftBackground: '#27272A',
    primaryText: '#FCA5A5',
    secondaryText: '#FAFAFA',
    mutedText: '#D4D4D8',
    accent: '#DC2626',
    accentDark: '#F87171',
    stripeColors: ['#DC2626', '#FAFAFA', '#FACC15'],
    photoBackground: '#3F3F46',
    photoBorder: '#FAFAFA',
  },
  {
    id: 'clean-white-green',
    label: 'Clean White Green',
    barBackground: '#FFFFFF',
    leftBackground: '#E8F7EF',
    primaryText: '#087A33',
    secondaryText: '#111827',
    mutedText: '#4B5563',
    accent: '#087A33',
    accentDark: '#045122',
    stripeColors: ['#087A33', '#FFFFFF', '#F6D21A'],
    photoBackground: '#DCFCE7',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'tricolor-bold',
    label: 'Tricolor Bold',
    barBackground: '#FFFFFF',
    leftBackground: '#FFF7ED',
    primaryText: '#0F766E',
    secondaryText: '#111827',
    mutedText: '#374151',
    accent: '#F97316',
    accentDark: '#047857',
    stripeColors: ['#F97316', '#FFFFFF', '#047857'],
    photoBackground: '#F0FDFA',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'deep-green-gold',
    label: 'Deep Green Gold',
    barBackground: '#052E16',
    leftBackground: '#064E3B',
    primaryText: '#FDE047',
    secondaryText: '#ECFDF5',
    mutedText: '#BBF7D0',
    accent: '#FACC15',
    accentDark: '#FDE047',
    stripeColors: ['#FACC15', '#ECFDF5', '#22C55E'],
    photoBackground: '#065F46',
    photoBorder: '#FDE047',
  },
  {
    id: 'blue-white',
    label: 'Blue White',
    barBackground: '#EFF6FF',
    leftBackground: '#DBEAFE',
    primaryText: '#1D4ED8',
    secondaryText: '#0F172A',
    mutedText: '#475569',
    accent: '#2563EB',
    accentDark: '#1E40AF',
    stripeColors: ['#2563EB', '#FFFFFF', '#FACC15'],
    photoBackground: '#BFDBFE',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'black-yellow',
    label: 'Black Yellow',
    barBackground: '#111111',
    leftBackground: '#262626',
    primaryText: '#FDE047',
    secondaryText: '#FFFFFF',
    mutedText: '#E5E5E5',
    accent: '#F6D21A',
    accentDark: '#FDE047',
    stripeColors: ['#F6D21A', '#FFFFFF', '#16A34A'],
    photoBackground: '#404040',
    photoBorder: '#F6D21A',
  },
  {
    id: 'lotus-orange',
    label: 'Lotus Orange',
    barBackground: '#FFF7ED',
    leftBackground: '#FFEDD5',
    primaryText: '#C2410C',
    secondaryText: '#431407',
    mutedText: '#9A3412',
    accent: '#FB923C',
    accentDark: '#C2410C',
    stripeColors: ['#FB923C', '#FFF7ED', '#15803D'],
    photoBackground: '#FED7AA',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'emerald-mist',
    label: 'Emerald Mist',
    barBackground: '#ECFDF5',
    leftBackground: '#D1FAE5',
    primaryText: '#047857',
    secondaryText: '#064E3B',
    mutedText: '#065F46',
    accent: '#10B981',
    accentDark: '#047857',
    stripeColors: ['#F97316', '#FFFFFF', '#10B981'],
    photoBackground: '#A7F3D0',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'slate-saffron',
    label: 'Slate Saffron',
    barBackground: '#F8FAFC',
    leftBackground: '#E2E8F0',
    primaryText: '#EA580C',
    secondaryText: '#0F172A',
    mutedText: '#475569',
    accent: '#F97316',
    accentDark: '#C2410C',
    stripeColors: ['#F97316', '#FFFFFF', '#334155'],
    photoBackground: '#CBD5E1',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'sand-green',
    label: 'Sand Green',
    barBackground: '#FEFCE8',
    leftBackground: '#F5F5DC',
    primaryText: '#166534',
    secondaryText: '#3F3F1F',
    mutedText: '#57534E',
    accent: '#65A30D',
    accentDark: '#3F6212',
    stripeColors: ['#F97316', '#FEFCE8', '#65A30D'],
    photoBackground: '#ECFCCB',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'wine-gold',
    label: 'Wine Gold',
    barBackground: '#FFF1F2',
    leftBackground: '#FFE4E6',
    primaryText: '#9F1239',
    secondaryText: '#4C0519',
    mutedText: '#881337',
    accent: '#E11D48',
    accentDark: '#9F1239',
    stripeColors: ['#E11D48', '#FFF1F2', '#FACC15'],
    photoBackground: '#FECDD3',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'steel-green',
    label: 'Steel Green',
    barBackground: '#111827',
    leftBackground: '#1F2937',
    primaryText: '#86EFAC',
    secondaryText: '#F9FAFB',
    mutedText: '#D1D5DB',
    accent: '#22C55E',
    accentDark: '#86EFAC',
    stripeColors: ['#22C55E', '#F9FAFB', '#FACC15'],
    photoBackground: '#374151',
    photoBorder: '#86EFAC',
  },
  {
    id: 'sunrise-red',
    label: 'Sunrise Red',
    barBackground: '#FFF7ED',
    leftBackground: '#FEE2E2',
    primaryText: '#B91C1C',
    secondaryText: '#431407',
    mutedText: '#7F1D1D',
    accent: '#EF4444',
    accentDark: '#B91C1C',
    stripeColors: ['#EF4444', '#FFF7ED', '#F59E0B'],
    photoBackground: '#FECACA',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'aqua-yellow',
    label: 'Aqua Yellow',
    barBackground: '#ECFEFF',
    leftBackground: '#CFFAFE',
    primaryText: '#0E7490',
    secondaryText: '#164E63',
    mutedText: '#155E75',
    accent: '#06B6D4',
    accentDark: '#0E7490',
    stripeColors: ['#06B6D4', '#FFFFFF', '#FACC15'],
    photoBackground: '#A5F3FC',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'forest-white',
    label: 'Forest White',
    barBackground: '#FFFFFF',
    leftBackground: '#DCFCE7',
    primaryText: '#14532D',
    secondaryText: '#111827',
    mutedText: '#374151',
    accent: '#15803D',
    accentDark: '#14532D',
    stripeColors: ['#15803D', '#FFFFFF', '#F97316'],
    photoBackground: '#BBF7D0',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'night-orange',
    label: 'Night Orange',
    barBackground: '#1C1917',
    leftBackground: '#292524',
    primaryText: '#FDBA74',
    secondaryText: '#FAFAF9',
    mutedText: '#D6D3D1',
    accent: '#F97316',
    accentDark: '#FDBA74',
    stripeColors: ['#F97316', '#FAFAF9', '#22C55E'],
    photoBackground: '#44403C',
    photoBorder: '#FDBA74',
  },
  {
    id: 'cream-red-green',
    label: 'Cream Red Green',
    barBackground: '#FFFBEB',
    leftBackground: '#FEF3C7',
    primaryText: '#B91C1C',
    secondaryText: '#365314',
    mutedText: '#713F12',
    accent: '#DC2626',
    accentDark: '#15803D',
    stripeColors: ['#DC2626', '#FFFBEB', '#15803D'],
    photoBackground: '#FDE68A',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'royal-purple-gold',
    label: 'Royal Purple Gold',
    barBackground: '#FAF5FF',
    leftBackground: '#E9D5FF',
    primaryText: '#6B21A8',
    secondaryText: '#2E1065',
    mutedText: '#6D28D9',
    accent: '#A855F7',
    accentDark: '#7E22CE',
    stripeColors: ['#A855F7', '#FAF5FF', '#FACC15'],
    photoBackground: '#DDD6FE',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'mono-clean',
    label: 'Mono Clean',
    barBackground: '#F9FAFB',
    leftBackground: '#E5E7EB',
    primaryText: '#111827',
    secondaryText: '#1F2937',
    mutedText: '#4B5563',
    accent: '#111827',
    accentDark: '#111827',
    stripeColors: ['#111827', '#F9FAFB', '#FACC15'],
    photoBackground: '#D1D5DB',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'saffron-gold',
    label: 'Saffron Gold',
    barBackground: '#FFF7D6',
    leftBackground: '#FFE889',
    primaryText: '#7A2E0E',
    secondaryText: '#3B2200',
    mutedText: '#6B4E16',
    accent: '#F4B400',
    accentDark: '#C65D00',
    stripeColors: ['#F97316', '#FFFFFF', '#F4B400'],
    photoBackground: '#FFE889',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'campaign-green',
    label: 'Campaign Green',
    barBackground: '#F7FFF9',
    leftBackground: '#DDF6E3',
    primaryText: '#087A33',
    secondaryText: '#113B24',
    mutedText: '#435046',
    accent: '#087A33',
    accentDark: '#045122',
    stripeColors: ['#F97316', '#FFFFFF', '#087A33'],
    photoBackground: '#DDF6E3',
    photoBorder: '#FFFFFF',
  },
  {
    id: 'royal-navy',
    label: 'Royal Navy',
    barBackground: '#F8FAFC',
    leftBackground: '#E0E7FF',
    primaryText: '#17335C',
    secondaryText: '#111827',
    mutedText: '#475569',
    accent: '#F6D21A',
    accentDark: '#17335C',
    stripeColors: ['#F97316', '#FFFFFF', '#17335C'],
    photoBackground: '#E0E7FF',
    photoBorder: '#FFFFFF',
  },
];

const LAYOUT_OPTIONS = [
  {
    id: 'circle-card',
    kind: 'circle-card',
    label: 'Circle Card',
    description: 'Circle photo with contact icons',
    previewShape: 'circle',
  },
  {
    id: 'circle-card-bold',
    kind: 'circle-card',
    label: 'Circle Card Bold',
    description: 'Bigger photo with compact info',
    previewShape: 'circle',
    variant: 'bold',
  },
  {
    id: 'circle-card-clean',
    kind: 'circle-card',
    label: 'Circle Card Clean',
    description: 'Clean spacing with full details',
    previewShape: 'circle',
    variant: 'clean',
  },
  {
    id: 'circle-card-band',
    kind: 'circle-card',
    label: 'Circle Card Band',
    description: 'Circle profile with party band feel',
    previewShape: 'circle',
    variant: 'band',
  },
  {
    id: 'square-gradient',
    kind: 'square-gradient',
    label: 'Square Gradient',
    description: 'Square photo and gradient details',
    previewShape: 'square',
  },
  {
    id: 'square-gradient-wide',
    kind: 'square-gradient',
    label: 'Square Gradient Wide',
    description: 'Wider photo with dense info',
    previewShape: 'square',
    variant: 'wide',
  },
  {
    id: 'square-gradient-soft',
    kind: 'square-gradient',
    label: 'Square Gradient Soft',
    description: 'Soft square panel with all info',
    previewShape: 'square',
    variant: 'soft',
  },
  {
    id: 'square-gradient-rail',
    kind: 'square-gradient',
    label: 'Square Gradient Rail',
    description: 'Accent rail and compact details',
    previewShape: 'square',
    variant: 'rail',
  },
  {
    id: 'angled-strip',
    kind: 'angled-strip',
    label: 'Angled Strip',
    description: 'Dynamic diagonal accent strip',
    previewShape: 'rounded',
  },
  {
    id: 'angled-strip-wide',
    kind: 'angled-strip',
    label: 'Angled Strip Wide',
    description: 'More room for info text',
    previewShape: 'rounded',
    variant: 'wide',
  },
  {
    id: 'angled-strip-dense',
    kind: 'angled-strip',
    label: 'Angled Strip Dense',
    description: 'Tighter strip with all info',
    previewShape: 'rounded',
    variant: 'dense',
  },
  {
    id: 'angled-strip-photo',
    kind: 'angled-strip',
    label: 'Angled Strip Photo',
    description: 'Larger photo with diagonal design',
    previewShape: 'rounded',
    variant: 'photo',
  },
  {
    id: 'social-badge',
    kind: 'social-badge',
    label: 'Social Badge',
    description: 'Photo badge with stacked social rows',
    previewShape: 'circle',
  },
  {
    id: 'social-badge-compact',
    kind: 'social-badge',
    label: 'Social Badge Compact',
    description: 'Compact stacked social layout',
    previewShape: 'circle',
    variant: 'compact',
  },
  {
    id: 'social-badge-wide',
    kind: 'social-badge',
    label: 'Social Badge Wide',
    description: 'Wider details with badge photo',
    previewShape: 'circle',
    variant: 'wide',
  },
  {
    id: 'social-badge-party',
    kind: 'social-badge',
    label: 'Social Badge Party',
    description: 'Party name highlighted in details',
    previewShape: 'circle',
    variant: 'party',
  },
  {
    id: 'full-photo-angled',
    kind: 'full-photo-angled',
    label: 'Full Photo Angled',
    description: 'Full-height photo with bold diagonal text card',
    previewShape: 'full',
  },
  {
    id: 'full-photo-angled-clean',
    kind: 'full-photo-angled',
    label: 'Full Photo Clean',
    description: 'Full photo without info hiding',
    previewShape: 'full',
    variant: 'clean',
  },
  {
    id: 'full-photo-angled-wide',
    kind: 'full-photo-angled',
    label: 'Full Photo Wide',
    description: 'Wider text card and full contact',
    previewShape: 'full',
    variant: 'wide',
  },
  {
    id: 'full-photo-angled-deep',
    kind: 'full-photo-angled',
    label: 'Full Photo Deep',
    description: 'Strong diagonal with bigger name',
    previewShape: 'full',
    variant: 'deep',
  },
  {
    id: 'leader-panel',
    kind: 'leader-panel',
    label: 'Leader Panel',
    description: 'Full left photo with circle highlight',
    previewShape: 'full',
  },
  {
    id: 'leader-panel-clean',
    kind: 'leader-panel',
    label: 'Leader Panel Clean',
    description: 'Cleaner leader panel spacing',
    previewShape: 'full',
    variant: 'clean',
  },
  {
    id: 'leader-panel-bold',
    kind: 'leader-panel',
    label: 'Leader Panel Bold',
    description: 'Bolder leader details',
    previewShape: 'full',
    variant: 'bold',
  },
  {
    id: 'leader-panel-stripe',
    kind: 'leader-panel',
    label: 'Leader Panel Stripe',
    description: 'Divider stripe emphasized',
    previewShape: 'full',
    variant: 'stripe',
  },
  {
    id: 'solid-overlay',
    kind: 'solid-overlay',
    label: 'Solid Overlay',
    description: 'Top photo and info with bottom solid strip',
    previewShape: 'full',
  },
  {
    id: 'solid-overlay-radius',
    kind: 'solid-overlay',
    label: 'Solid Overlay Radius',
    description: 'Rounded photo corner overlay',
    previewShape: 'full',
    variant: 'radius',
  },
  {
    id: 'solid-overlay-dense',
    kind: 'solid-overlay',
    label: 'Solid Overlay Dense',
    description: 'Reduced band height and full info',
    previewShape: 'full',
    variant: 'dense',
  },
  {
    id: 'solid-overlay-wide-photo',
    kind: 'solid-overlay',
    label: 'Solid Overlay Photo',
    description: 'More photo area and full info',
    previewShape: 'full',
    variant: 'photo',
  },
  {
    id: 'split-overlay',
    kind: 'split-overlay',
    label: 'Split Overlay',
    description: 'Left photo, right info and shared bottom band',
    previewShape: 'full',
  },
  {
    id: 'split-overlay-radius',
    kind: 'split-overlay',
    label: 'Split Overlay Radius',
    description: 'Larger rounded panel corners',
    previewShape: 'full',
    variant: 'radius',
  },
  {
    id: 'split-overlay-dense',
    kind: 'split-overlay',
    label: 'Split Overlay Dense',
    description: 'Compact lower band with all info',
    previewShape: 'full',
    variant: 'dense',
  },
  {
    id: 'split-overlay-photo',
    kind: 'split-overlay',
    label: 'Split Overlay Photo',
    description: 'Wider image split',
    previewShape: 'full',
    variant: 'photo',
  },
  {
    id: 'corner-overlay',
    kind: 'corner-overlay',
    label: 'Corner Overlay',
    description: 'Large rounded corners with solid bottom band',
    previewShape: 'full',
  },
  {
    id: 'corner-overlay-soft',
    kind: 'corner-overlay',
    label: 'Corner Overlay Soft',
    description: 'Softer radius with strong identity band',
    previewShape: 'full',
    variant: 'soft',
  },
  {
    id: 'corner-overlay-bold',
    kind: 'corner-overlay',
    label: 'Corner Overlay Bold',
    description: 'Bolder corners and name emphasis',
    previewShape: 'full',
    variant: 'bold',
  },
  {
    id: 'corner-overlay-photo',
    kind: 'corner-overlay',
    label: 'Corner Overlay Photo',
    description: 'Larger top photo panel',
    previewShape: 'full',
    variant: 'photo',
  },
  {
    id: 'reverse-angled',
    kind: 'reverse-angled',
    label: 'Reverse Angled',
    description: 'Diagonal strip from the opposite side',
    previewShape: 'full',
  },
  {
    id: 'reverse-angled-wide',
    kind: 'reverse-angled',
    label: 'Reverse Angled Wide',
    description: 'Wider text with right photo',
    previewShape: 'full',
    variant: 'wide',
  },
  {
    id: 'reverse-angled-dense',
    kind: 'reverse-angled',
    label: 'Reverse Angled Dense',
    description: 'Compact reverse angle layout',
    previewShape: 'full',
    variant: 'dense',
  },
  {
    id: 'reverse-angled-photo',
    kind: 'reverse-angled',
    label: 'Reverse Angled Photo',
    description: 'Larger right photo and diagonal strip',
    previewShape: 'full',
    variant: 'photo',
  },
  {
    id: 'dual-corner',
    kind: 'corner-overlay',
    label: 'Dual Corner',
    description: 'Top-left and bottom-right rounded balance',
    previewShape: 'full',
    variant: 'dual',
  },
  {
    id: 'dual-corner-bold',
    kind: 'corner-overlay',
    label: 'Dual Corner Bold',
    description: 'Bold name with dual rounded panel',
    previewShape: 'full',
    variant: 'dual-bold',
  },
  {
    id: 'campaign-panel',
    kind: 'leader-panel',
    label: 'Campaign Panel',
    description: 'Leader panel with campaign divider',
    previewShape: 'full',
    variant: 'campaign',
  },
  {
    id: 'campaign-panel-wide',
    kind: 'leader-panel',
    label: 'Campaign Panel Wide',
    description: 'Wide campaign details panel',
    previewShape: 'full',
    variant: 'campaign-wide',
  },
  {
    id: 'right-strip-card',
    kind: 'reverse-angled',
    label: 'Right Strip Card',
    description: 'Right photo with angled strip card',
    previewShape: 'full',
    variant: 'right-strip',
  },
  {
    id: 'left-strip-card',
    kind: 'angled-strip',
    label: 'Left Strip Card',
    description: 'Left strip card with all info',
    previewShape: 'rounded',
    variant: 'left-strip',
  },
  {
    id: 'identity-banner',
    kind: 'solid-overlay',
    label: 'Identity Banner',
    description: 'Solid identity band with full info',
    previewShape: 'full',
    variant: 'identity',
  },
  {
    id: 'identity-banner-photo',
    kind: 'solid-overlay',
    label: 'Identity Banner Photo',
    description: 'Identity band with larger photo',
    previewShape: 'full',
    variant: 'identity-photo',
  },
  {
    id: 'badge-panel',
    kind: 'social-badge',
    label: 'Badge Panel',
    description: 'Badge style with dense info',
    previewShape: 'circle',
    variant: 'badge-panel',
  },
  {
    id: 'badge-panel-wide',
    kind: 'social-badge',
    label: 'Badge Panel Wide',
    description: 'Wide badge panel with all info',
    previewShape: 'circle',
    variant: 'badge-wide',
  },
  {
    id: 'arch-portrait',
    kind: 'arch-portrait',
    label: 'Arch Portrait',
    description: 'Large arch photo with premium info card',
    previewShape: 'arch',
  },
  {
    id: 'arch-portrait-medallion',
    kind: 'arch-portrait',
    label: 'Arch Medallion',
    description: 'Arch photo with circular head halo',
    previewShape: 'arch',
    variant: 'medallion',
  },
  {
    id: 'flag-ribbon',
    kind: 'flag-ribbon',
    label: 'Flag Ribbon',
    description: 'Flag wave base with full left photo',
    previewShape: 'wave',
  },
  {
    id: 'flag-ribbon-reverse',
    kind: 'flag-ribbon',
    label: 'Flag Ribbon Reverse',
    description: 'Reverse wave flow with strong name block',
    previewShape: 'wave',
    variant: 'reverse',
  },
  {
    id: 'ticket-frame',
    kind: 'ticket-frame',
    label: 'Ticket Frame',
    description: 'Notched ticket style identity layout',
    previewShape: 'ticket',
  },
  {
    id: 'ticket-frame-dark',
    kind: 'ticket-frame',
    label: 'Ticket Frame Dark',
    description: 'Ticket card with deeper identity rail',
    previewShape: 'ticket',
    variant: 'dark',
  },
  {
    id: 'vertical-rail',
    kind: 'vertical-rail',
    label: 'Vertical Rail',
    description: 'Tall photo with vertical party rail',
    previewShape: 'rail',
  },
  {
    id: 'vertical-rail-cut',
    kind: 'vertical-rail',
    label: 'Vertical Rail Cut',
    description: 'Rail layout with diagonal photo cut',
    previewShape: 'rail',
    variant: 'cut',
  },
  {
    id: 'diagonal-plaque',
    kind: 'diagonal-plaque',
    label: 'Diagonal Plaque',
    description: 'Photo left with diagonal name plaque',
    previewShape: 'diagonal',
  },
  {
    id: 'diagonal-plaque-right',
    kind: 'diagonal-plaque',
    label: 'Diagonal Plaque Right',
    description: 'Opposite diagonal balance with full info',
    previewShape: 'diagonal',
    variant: 'right',
  },
  {
    id: 'window-card',
    kind: 'window-card',
    label: 'Window Card',
    description: 'Framed photo window with stacked info',
    previewShape: 'window',
  },
  {
    id: 'window-card-banner',
    kind: 'window-card',
    label: 'Window Banner',
    description: 'Window photo with bottom banner identity',
    previewShape: 'window',
    variant: 'banner',
  },
  {
    id: 'signature-strip',
    kind: 'signature-strip',
    label: 'Signature Strip',
    description: 'Large signature-style name strip',
    previewShape: 'signature',
  },
  {
    id: 'signature-strip-ribbon',
    kind: 'signature-strip',
    label: 'Signature Ribbon',
    description: 'Signature layout with angled ribbon base',
    previewShape: 'signature',
    variant: 'ribbon',
  },
  {
    id: 'crest-panel',
    kind: 'crest-panel',
    label: 'Crest Panel',
    description: 'Ceremonial crest panel with full details',
    previewShape: 'crest',
  },
  {
    id: 'crest-panel-royal',
    kind: 'crest-panel',
    label: 'Crest Royal',
    description: 'Royal crest panel with bold identity',
    previewShape: 'crest',
    variant: 'royal',
  },
  {
    id: 'overlay-slab',
    kind: 'overlay-slab',
    label: 'Overlay Slab',
    description: 'Strong bottom slab with left portrait',
    previewShape: 'full',
  },
  {
    id: 'overlay-slab-corner',
    kind: 'overlay-slab',
    label: 'Overlay Slab Corner',
    description: 'Rounded slab overlay with dense details',
    previewShape: 'full',
    variant: 'corner',
  },
  {
    id: 'wave-panel',
    kind: 'wave-panel',
    label: 'Wave Panel',
    description: 'Wave overlay with full-height photo',
    previewShape: 'wave',
  },
  {
    id: 'wave-panel-deep',
    kind: 'wave-panel',
    label: 'Wave Panel Deep',
    description: 'Deeper wave card with bold name',
    previewShape: 'wave',
    variant: 'deep',
  },
  {
    id: 'stacked-card',
    kind: 'stacked-card',
    label: 'Stacked Card',
    description: 'Layered cards for party and contact details',
    previewShape: 'window',
  },
  {
    id: 'stacked-card-ribbon',
    kind: 'stacked-card',
    label: 'Stacked Ribbon',
    description: 'Layered card with angled ribbon base',
    previewShape: 'window',
    variant: 'ribbon',
  },
  {
    id: 'royal-overlay',
    kind: 'royal-overlay',
    label: 'Royal Overlay',
    description: 'Premium overlay frame with full details',
    previewShape: 'crest',
  },
  {
    id: 'royal-overlay-gold',
    kind: 'royal-overlay',
    label: 'Royal Overlay Gold',
    description: 'Gold inspired overlay with strong identity',
    previewShape: 'crest',
    variant: 'gold',
  },
];

const FEATURED_LAYOUT_KIND_ORDER = [
  'overlay-slab',
  'wave-panel',
  'stacked-card',
  'royal-overlay',
  'arch-portrait',
  'flag-ribbon',
  'ticket-frame',
  'vertical-rail',
  'diagonal-plaque',
  'window-card',
  'signature-strip',
  'crest-panel',
];

function getLayoutGroupSortOrder(kind, fallbackIndex) {
  const featuredIndex = FEATURED_LAYOUT_KIND_ORDER.indexOf(kind);
  return featuredIndex === -1 ? FEATURED_LAYOUT_KIND_ORDER.length + fallbackIndex : featuredIndex;
}

const LAYOUT_GROUPS = LAYOUT_OPTIONS.reduce((groups, layout) => {
  const existing = groups.find((group) => group.kind === layout.kind);
  if (existing) {
    existing.variants.push(layout);
    return groups;
  }
  groups.push({
    kind: layout.kind,
    label: layout.label,
    description: layout.description,
    previewShape: layout.previewShape,
    orderIndex: groups.length,
    variants: [layout],
  });
  return groups;
}, []).sort((first, second) => getLayoutGroupSortOrder(first.kind, first.orderIndex) - getLayoutGroupSortOrder(second.kind, second.orderIndex));

function getLayoutFamilyLabel(layout) {
  return LAYOUT_GROUPS.find((group) => group.kind === layout?.kind)?.label || layout?.label || 'Layout';
}

const FIELD_CONFIG = [
  { key: 'name', label: 'नाम', placeholder: 'पूरा नाम डालें', required: true, keyboardType: 'default' },
  { key: 'designation', label: 'पद', placeholder: 'उदाहरण: बूथ प्रभारी', required: false, keyboardType: 'default', maxLength: 38 },
  { key: 'mobile', label: 'मोबाइल नंबर', placeholder: 'मोबाइल नंबर डालें', required: false, keyboardType: 'phone-pad', maxLength: 10 },
  { key: 'email', label: 'Gmail / Email ID', placeholder: 'example@gmail.com', required: false, keyboardType: 'email-address', maxLength: 48, autoCapitalize: 'none' },
  { key: 'facebookInstagram', label: 'Facebook/Instagram', placeholder: 'Optional Facebook or Instagram handle', keyboardType: 'default', autoCapitalize: 'none' },
];

function CustomizationField({ label, value, onChangeText, placeholder, keyboardType, required, maxLength, autoCapitalize }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function buildLocationLine(district, hasRightDetails) {
  const baseLine = district || '';
  if (!hasRightDetails || baseLine.length <= LOCATION_LINE_MAX_LENGTH_WITH_CONTACT) return baseLine;
  return `${baseLine.slice(0, LOCATION_LINE_MAX_LENGTH_WITH_CONTACT).trimEnd()}...`;
}

function getHindiDistrict(district) {
  const trimmed = String(district || '').trim();
  return DISTRICT_HI_MAP[trimmed] || trimmed;
}

function hasDevanagari(value) {
  return /[\u0900-\u097F]/.test(String(value || ''));
}

function readHindiVowel(text, index) {
  const two = text.slice(index, index + 2);
  if (HINDI_INDEPENDENT_VOWELS[two]) return { key: two, length: 2 };
  const one = text[index];
  if (HINDI_INDEPENDENT_VOWELS[one]) return { key: one, length: 1 };
  return null;
}

function readHindiConsonant(text, index) {
  const three = text.slice(index, index + 3);
  if (HINDI_DIGRAPHS[three]) return { text: HINDI_DIGRAPHS[three], length: 3 };
  const two = text.slice(index, index + 2);
  if (HINDI_DIGRAPHS[two]) return { text: HINDI_DIGRAPHS[two], length: 2 };
  const one = text[index];
  if (HINDI_CONSONANTS[one]) return { text: HINDI_CONSONANTS[one], length: 1 };
  return null;
}

function transliterateWordToHindi(word) {
  const cleanWord = String(word || '').trim();
  if (!cleanWord || hasDevanagari(cleanWord)) return cleanWord;
  const lower = cleanWord.toLowerCase();
  const mapped = HINDI_WORD_MAP[lower.replace(/[^a-z]/g, '')];
  if (mapped) return mapped;

  let output = '';
  let index = 0;
  while (index < lower.length) {
    const char = lower[index];
    if (!/[a-z]/.test(char)) {
      output += cleanWord[index] || char;
      index += 1;
      continue;
    }

    const vowel = readHindiVowel(lower, index);
    if (vowel) {
      output += HINDI_INDEPENDENT_VOWELS[vowel.key];
      index += vowel.length;
      continue;
    }

    const consonant = readHindiConsonant(lower, index);
    if (!consonant) {
      output += cleanWord[index] || char;
      index += 1;
      continue;
    }

    const vowelAfter = readHindiVowel(lower, index + consonant.length);
    if (vowelAfter) {
      output += consonant.text + HINDI_VOWEL_SIGNS[vowelAfter.key];
      index += consonant.length + vowelAfter.length;
    } else {
      const nextChar = lower[index + consonant.length];
      output += consonant.text + (nextChar && /[a-z]/.test(nextChar) ? '्' : '');
      index += consonant.length;
    }
  }

  return output || cleanWord;
}

function toHindiDisplay(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  return raw
    .split(/(\s+|[-/|,]+)/)
    .map((part) => (/^[a-zA-Z]+$/.test(part) ? transliterateWordToHindi(part) : part))
    .join('');
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'R';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isLocalPosterPhotoUri(uri) {
  return Boolean(uri && POSTER_PHOTO_DIRECTORY && uri.startsWith(`${POSTER_PHOTO_DIRECTORY}/`));
}

async function deleteLocalPosterPhoto(uri) {
  if (!isLocalPosterPhotoUri(uri)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

async function persistPosterPhoto(sourceUri) {
  if (!sourceUri || !POSTER_PHOTO_DIRECTORY) return sourceUri || '';
  try {
    await FileSystem.makeDirectoryAsync(POSTER_PHOTO_DIRECTORY, { intermediates: true }).catch(() => {});
    const targetUri = `${POSTER_PHOTO_DIRECTORY}/poster-photo-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
    return targetUri;
  } catch (_error) {
    return sourceUri;
  }
}

function ThemePicker({ visible, selectedThemeId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Choose Theme</Text>
          <Text style={styles.sheetSubtitle}>Bottom profile bar ke color aur text contrast yahan se change karein.</Text>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.themeList}
            showsVerticalScrollIndicator={false}
          >
            {THEME_OPTIONS.map((theme) => {
              const active = theme.id === selectedThemeId;
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                  onPress={() => {
                    onSelect(theme.id);
                    onClose();
                  }}
                >
                  <View style={[styles.themePreview, { backgroundColor: theme.barBackground }]}>
                    <View style={[styles.themePreviewPhoto, { backgroundColor: theme.leftBackground }]} />
                    <View style={styles.themePreviewTextWrap}>
                      <Text style={[styles.themePreviewTitle, { color: theme.primaryText }]}>Name</Text>
                      <Text style={[styles.themePreviewMeta, { color: theme.secondaryText }]}>Pad | District</Text>
                    </View>
                    <View style={[styles.themePreviewAccent, { backgroundColor: theme.accent }]} />
                  </View>
                  <View style={styles.themeContent}>
                    <Text style={styles.themeLabel}>{theme.label}</Text>
                    <Text style={styles.themeHint}>Bottom profile bar colors</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={Colors.rlpGreen} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LayoutPicker({ visible, selectedLayoutId, onSelect, onClose, theme }) {
  const selectedLayout = LAYOUT_OPTIONS.find((layout) => layout.id === selectedLayoutId) || LAYOUT_OPTIONS[0];
  const [expandedKind, setExpandedKind] = useState(selectedLayout.kind);

  useEffect(() => {
    if (visible) setExpandedKind(selectedLayout.kind);
  }, [selectedLayout.kind, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Choose Layout</Text>
          <Text style={styles.sheetSubtitle}>Main design family choose karo, arrow se uski variations open hongi.</Text>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.themeList}
            showsVerticalScrollIndicator={false}
          >
            {LAYOUT_GROUPS.map((group) => {
              const active = group.kind === selectedLayout.kind;
              const expanded = expandedKind === group.kind;
              const hasVariants = group.variants.length > 1;
              return (
                <View key={group.kind} style={[styles.layoutGroupCard, active && styles.themeCardActive]}>
                  <Pressable
                    style={styles.layoutGroupHeader}
                    onPress={() => {
                      onSelect(group.variants[0].id);
                      if (!hasVariants) {
                        onClose();
                        return;
                      }
                      setExpandedKind(group.kind);
                    }}
                  >
                    <View style={[styles.layoutPreview, { backgroundColor: theme.barBackground }]}>
                      <View
                        style={[
                          styles.layoutPreviewPhoto,
                          group.previewShape === 'circle' && styles.layoutPreviewPhotoCircle,
                          group.previewShape === 'square' && styles.layoutPreviewPhotoSquare,
                          group.previewShape === 'rounded' && styles.layoutPreviewPhotoRounded,
                          group.previewShape === 'full' && styles.layoutPreviewPhotoFull,
                          group.previewShape === 'arch' && styles.layoutPreviewPhotoArch,
                          group.previewShape === 'wave' && styles.layoutPreviewPhotoWave,
                          group.previewShape === 'ticket' && styles.layoutPreviewPhotoTicket,
                          group.previewShape === 'rail' && styles.layoutPreviewPhotoRail,
                          group.previewShape === 'diagonal' && styles.layoutPreviewPhotoDiagonal,
                          group.previewShape === 'window' && styles.layoutPreviewPhotoWindow,
                          group.previewShape === 'signature' && styles.layoutPreviewPhotoSignature,
                          group.previewShape === 'crest' && styles.layoutPreviewPhotoCrest,
                          { backgroundColor: theme.leftBackground, borderColor: theme.accent },
                        ]}
                      />
                      <View style={styles.layoutPreviewLines}>
                        <View style={[styles.layoutPreviewLineStrong, { backgroundColor: theme.primaryText }]} />
                        <View style={[styles.layoutPreviewLine, { backgroundColor: theme.accent }]} />
                        <View style={[styles.layoutPreviewLineSmall, { backgroundColor: theme.mutedText }]} />
                      </View>
                    </View>
                    <View style={styles.themeContent}>
                      <Text style={styles.themeLabel}>{group.label}</Text>
                      <Text style={styles.themeHint}>
                        {group.description}
                        {hasVariants ? ` • ${group.variants.length} variations` : ''}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={Colors.rlpGreen} /> : null}
                    {hasVariants ? (
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.onSurfaceVariant} />
                    ) : null}
                  </Pressable>
                  {expanded ? (
                    <View style={styles.layoutVariantList}>
                      {group.variants.map((layout, index) => {
                        const variantActive = layout.id === selectedLayoutId;
                        return (
                          <Pressable
                            key={layout.id}
                            style={[styles.layoutVariantRow, variantActive && styles.layoutVariantRowActive]}
                            onPress={() => {
                              onSelect(layout.id);
                              onClose();
                            }}
                          >
                            <View style={[styles.layoutVariantDot, { backgroundColor: variantActive ? theme.accent : Colors.outlineVariant }]} />
                            <View style={styles.themeContent}>
                              <Text style={styles.layoutVariantLabel}>
                                {index === 0 ? 'Default' : layout.label}
                              </Text>
                              <Text style={styles.themeHint}>{layout.description}</Text>
                            </View>
                            {variantActive ? <Ionicons name="checkmark" size={18} color={Colors.rlpGreen} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ToolButton({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toolBtn,
        disabled && styles.toolBtnDisabled,
        pressed && !disabled && { opacity: 0.82 },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={disabled ? Colors.outline : Colors.rlpGreen} />
      <Text style={[styles.toolText, disabled && styles.toolTextDisabled]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function buildPosterProfileData(customization, user) {
  const name = toHindiDisplay(customization.name.trim()) || FALLBACK_PROFILE_CONTENT.name;
  const designation = toHindiDisplay(customization.designation.trim()) || DEFAULT_DESIGNATION;
  const district = customization.district.trim() || user?.district?.trim?.() || user?.city?.trim?.() || '';
  const mobile = customization.mobile.trim();
  const email = customization.email.trim();
  const social = customization.facebookInstagram.trim();
  const hasRightDetails = Boolean(mobile || email || social);
  const locationLine = district ? `जिला: ${buildLocationLine(getHindiDistrict(district), hasRightDetails)}` : '';
  const photoUri = customization.posterPhotoUri || getUserProfilePhoto(user);
  const contactItems = [
    mobile ? { key: 'mobile', icon: 'call-outline', text: mobile } : null,
    email ? { key: 'email', icon: 'mail-outline', text: email } : null,
    social ? { key: 'social', icon: social.toLowerCase().includes('fb') || social.toLowerCase().includes('facebook') ? 'logo-facebook' : 'logo-instagram', text: social } : null,
  ].filter(Boolean);

  return {
    name,
    designation,
    locationLine,
    photoUri,
    contactItems,
  };
}

function ProfilePhoto({ uri, name, compact, theme, variant = 'portrait', style }) {
  return (
    <View
      style={[
        styles.profilePhotoFrame,
        compact && styles.profilePhotoFrameCompact,
        variant === 'circle' && styles.profilePhotoCircle,
        variant === 'square' && styles.profilePhotoSquare,
        variant === 'rounded' && styles.profilePhotoRounded,
        { backgroundColor: theme.photoBackground, borderColor: theme.photoBorder },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.profilePhoto} resizeMode="cover" />
      ) : (
        <Text style={[styles.profileInitials, compact && styles.profileInitialsCompact, { color: theme.accentDark }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

function FullHeightPhoto({ uri, name, theme, style, imageStyle, circleStyle }) {
  return (
    <View style={[styles.fullPhotoShell, { backgroundColor: theme.leftBackground }, style]}>
      <View style={[styles.fullPhotoHalo, { backgroundColor: theme.accent }, circleStyle]} />
      {uri ? (
        <Image source={{ uri }} style={[styles.fullPhotoImage, imageStyle]} resizeMode="cover" />
      ) : (
        <Text style={[styles.fullPhotoInitials, { color: theme.accentDark }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

function IconText({ icon, text, theme, style, textStyle, iconColor, iconSize = 11 }) {
  if (!text) return null;
  return (
    <View style={[styles.iconText, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor || theme.accentDark} />
      <Text style={[styles.iconTextLabel, { color: theme.secondaryText }, textStyle]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ContactPill({ item, theme, style, large = false }) {
  if (!item?.text) return null;
  return (
    <View style={[styles.contactPill, large && styles.contactPillLarge, { borderColor: theme.accent, backgroundColor: theme.barBackground }, style]}>
      <Ionicons name={item.icon} size={large ? 13 : 10} color={theme.accentDark} />
      <Text style={[styles.contactPillText, large && styles.contactPillTextLarge, { color: theme.secondaryText }]} numberOfLines={1}>{item.text}</Text>
    </View>
  );
}

function DesignationLine({ text, theme, style, textStyle, pill = false, light = false, iconSize = 13 }) {
  if (!text) return null;
  const textColor = light ? theme.barBackground : theme.secondaryText;
  const iconColor = light ? theme.barBackground : theme.accentDark;
  const safeIconSize = Math.min(iconSize, 14);
  return (
    <View style={[styles.designationLine, pill && styles.designationLinePill, pill && { backgroundColor: theme.accent }, style]}>
      <Ionicons name="person-circle-outline" size={safeIconSize} color={iconColor} style={styles.designationLineIcon} />
      <Text
        style={[styles.designationLineText, { color: textColor }, pill && styles.designationLinePillText, textStyle]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {text}
      </Text>
    </View>
  );
}

function PosterName({ name, compact, theme, style, centered = false }) {
  return (
    <Text
      style={[
        styles.profileName,
        compact && styles.profileNameCompact,
        centered && styles.profileTextCentered,
        { color: theme.primaryText },
        style,
        styles.profileNameNoClip,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
    >
      {name.toUpperCase()}
    </Text>
  );
}

function PartyName({ theme, style, light = false, centered = false }) {
  return (
    <Text
      style={[
        styles.partyName,
        centered && styles.profileTextCentered,
        { color: light ? theme.barBackground : theme.accentDark },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.78}
    >
      {PARTY_NAME_HI}
    </Text>
  );
}

function BottomIdentityBand({ data, theme, style, partyStyle, designationStyle, backgroundColor }) {
  return (
    <View style={[styles.bottomIdentityBand, { backgroundColor: backgroundColor || theme.accentDark }, style]}>
      <PartyName theme={theme} light style={[styles.bottomIdentityParty, partyStyle]} />
      <DesignationLine text={data.designation} theme={theme} light style={[styles.bottomIdentityDesignation, designationStyle]} />
    </View>
  );
}

function PosterProfileBar({ customization, user, compact, theme, layout }) {
  const data = buildPosterProfileData(customization, user);
  const layoutId = layout?.kind || layout?.id || DEFAULT_LAYOUT_ID;
  const variant = String(layout?.variant || '');
  const variantHas = (token) => variant.includes(token);

  if (layoutId === 'circle-card') {
    return (
      <View style={[styles.profileBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <LinearGradient
          colors={[theme.leftBackground, theme.barBackground, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.circleLayoutContent, variantHas('clean') && styles.circleLayoutContentClean, variantHas('band') && styles.circleLayoutContentBand]}
        >
          <View style={[styles.circlePhotoColumn, variantHas('bold') && styles.circlePhotoColumnBold]}>
            <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="circle" style={[styles.circleLayoutPhoto, variantHas('bold') && styles.circleLayoutPhotoLarge]} />
          </View>
          <View style={styles.circleDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} />
            <DesignationLine text={data.designation} theme={theme} pill light />
            <PartyName theme={theme} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} />
            <View style={styles.contactWrap}>
              {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large />)}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (layoutId === 'square-gradient') {
    return (
      <LinearGradient
        colors={[theme.barBackground, theme.leftBackground, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileBar, styles.squareGradientBar, variantHas('soft') && styles.squareGradientSoft, compact && styles.profileBarCompact]}
      >
        <View style={[styles.squareAccentRail, variantHas('rail') && styles.squareAccentRailWide, { backgroundColor: theme.accent }]} />
        <View style={[styles.squarePhotoColumn, variantHas('wide') && styles.squarePhotoColumnWide]}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="square" style={[styles.squareLayoutPhoto, variantHas('wide') && styles.squareLayoutPhotoWide]} />
        </View>
        <View style={styles.squareDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} />
          <DesignationLine text={data.designation} theme={theme} style={styles.squareDesignation} />
          <PartyName theme={theme} style={styles.squareParty} />
          <View style={styles.squareInfoGrid}>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.squareInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} style={styles.squareInfoLine} />
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (layoutId === 'angled-strip') {
    return (
      <View style={[styles.profileBar, styles.angledBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.angledShape, { backgroundColor: theme.accent }]} />
        <View style={[styles.angledShapeLight, { backgroundColor: theme.leftBackground }]} />
        <View style={[styles.angledContent, variantHas('dense') && styles.angledContentDense]}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="rounded" style={[styles.angledPhoto, variantHas('photo') && styles.angledPhotoLarge]} />
          <View style={styles.angledDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} style={styles.angledName} />
            <DesignationLine text={data.designation} theme={theme} style={styles.angledDesignationRow} />
            <PartyName theme={theme} style={styles.angledPartyName} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.angledIconLine} />
            <View style={styles.angledContactRow}>
              {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.angledContactPill} />)}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'social-badge') {
    return (
      <View style={[styles.profileBar, styles.socialBadgeBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.socialTopLine, { backgroundColor: theme.accent }]} />
        <View style={[styles.socialBadgeContent, variantHas('compact') && styles.socialBadgeContentCompact]}>
          <View style={[styles.socialPhotoWrap, variantHas('wide') && styles.socialPhotoWrapWide]}>
            <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="circle" style={[styles.socialBadgePhoto, variantHas('wide') && styles.socialBadgePhotoWide]} />
          </View>
          <View style={styles.socialDetails}>
            <PosterName name={data.name} compact={compact} theme={theme} />
            <DesignationLine text={data.designation} theme={theme} style={styles.socialDesignation} />
            <PartyName theme={theme} style={styles.socialParty} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.socialInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} style={styles.socialInfoLine} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'full-photo-angled') {
    return (
      <View style={[styles.profileBar, styles.fullPhotoAngledBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.fullPhotoAngledImage} circleStyle={styles.fullPhotoHeadHalo} />
        <View style={[styles.fullPhotoDiagonal, variantHas('clean') && styles.fullPhotoDiagonalClean, { backgroundColor: theme.accent }]} />
        <View style={[styles.fullPhotoAngledDetails, variantHas('wide') && styles.fullPhotoAngledDetailsWide]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.fullPhotoName, variantHas('deep') && styles.fullPhotoNameDeep]} />
          <DesignationLine text={data.designation} theme={theme} style={styles.fullPhotoDesignation} />
          <PartyName theme={theme} style={styles.fullPhotoParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.fullPhotoInfoLine} />
          <View style={styles.fullPhotoContactRow}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.fullPhotoContactPill} />)}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'leader-panel') {
    return (
      <View style={[styles.profileBar, styles.leaderPanelBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.leaderPanelCircle, { backgroundColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.leaderPanelPhoto} circleStyle={styles.leaderPanelHalo} />
        <View style={[styles.leaderPanelDetails, variantHas('wide') && styles.leaderPanelDetailsWide]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.leaderPanelName, variantHas('bold') && styles.leaderPanelNameBold]} />
          <DesignationLine text={data.designation} theme={theme} style={styles.leaderPanelDesignation} />
          <PartyName theme={theme} style={styles.leaderPanelParty} />
          <View style={[styles.leaderPanelDividerRow, variantHas('stripe') && styles.leaderPanelDividerRowBold, variantHas('campaign') && styles.leaderPanelDividerRowCampaign]}>
            {theme.stripeColors.map((color, index) => <View key={`${color}-${index}`} style={[styles.leaderPanelDivider, { backgroundColor: color }]} />)}
          </View>
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.leaderPanelInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} style={styles.leaderPanelInfoLine} />
          ))}
        </View>
      </View>
    );
  }

  if (layoutId === 'solid-overlay') {
    return (
      <View style={[styles.profileBar, styles.solidOverlayBar, variantHas('radius') && styles.solidOverlayBarRadius, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={styles.solidOverlayTop}>
          <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={[styles.solidOverlayPhoto, variantHas('photo') && styles.solidOverlayPhotoWide]} circleStyle={styles.solidOverlayHalo} />
          <View style={styles.solidOverlayInfo}>
            <PosterName name={data.name} compact={compact} theme={theme} style={styles.solidOverlayName} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.solidOverlayInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.solidOverlayInfoLine} />
            ))}
          </View>
        </View>
        <BottomIdentityBand data={data} theme={theme} style={[styles.solidOverlayBottom, variantHas('dense') && styles.identityBandDense]} backgroundColor={theme.accentDark} />
      </View>
    );
  }

  if (layoutId === 'split-overlay') {
    return (
      <View style={[styles.profileBar, styles.splitOverlayBar, variantHas('radius') && styles.splitOverlayBarRadius, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={styles.splitOverlayMain}>
          <View style={[styles.splitOverlayPhotoPane, variantHas('photo') && styles.splitOverlayPhotoPaneWide, { backgroundColor: theme.leftBackground }]}>
            <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.splitOverlayPhoto} circleStyle={styles.splitOverlayHalo} />
          </View>
          <View style={styles.splitOverlayInfoPane}>
            <PosterName name={data.name} compact={compact} theme={theme} style={styles.splitOverlayName} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.splitOverlayInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.splitOverlayInfoLine} />
            ))}
          </View>
        </View>
        <BottomIdentityBand data={data} theme={theme} style={[styles.splitOverlayBand, variantHas('dense') && styles.identityBandDense]} backgroundColor={theme.accent} />
      </View>
    );
  }

  if (layoutId === 'corner-overlay') {
    return (
      <View style={[styles.profileBar, styles.cornerOverlayBar, variantHas('soft') && styles.cornerOverlayBarSoft, variantHas('dual') && styles.cornerOverlayBarDual, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={styles.cornerOverlayTop}>
          <View style={[styles.cornerPhotoPanel, variantHas('photo') && styles.cornerPhotoPanelWide, { backgroundColor: theme.leftBackground }]}>
            <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.cornerOverlayPhoto} circleStyle={styles.cornerOverlayHalo} />
          </View>
          <View style={styles.cornerOverlayInfo}>
            <PosterName name={data.name} compact={compact} theme={theme} style={[styles.cornerOverlayName, variantHas('bold') && styles.cornerOverlayNameBold]} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={15} style={styles.cornerOverlayInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={15} style={styles.cornerOverlayInfoLine} />
            ))}
          </View>
        </View>
        <BottomIdentityBand data={data} theme={theme} style={styles.cornerOverlayBand} backgroundColor={theme.accentDark} />
      </View>
    );
  }

  if (layoutId === 'reverse-angled') {
    return (
      <View style={[styles.profileBar, styles.reverseAngledBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.reverseAngledShape, { backgroundColor: theme.accent }]} />
        <View style={[styles.reverseAngledLight, { backgroundColor: theme.leftBackground }]} />
        <View style={[styles.reverseAngledDetails, variantHas('wide') && styles.reverseAngledDetailsWide, variantHas('dense') && styles.reverseAngledDetailsDense]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.reverseAngledName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.reverseAngledDesignation} />
          <PartyName theme={theme} style={styles.reverseAngledParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.reverseAngledInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.reverseAngledInfoLine} />
          ))}
        </View>
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={[styles.reverseAngledPhoto, variantHas('photo') && styles.reverseAngledPhotoWide]} circleStyle={styles.reverseAngledHalo} />
      </View>
    );
  }

  if (layoutId === 'arch-portrait') {
    return (
      <View style={[styles.profileBar, styles.archPortraitBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.archPortraitBackdrop, { backgroundColor: theme.leftBackground }]} />
        <View style={[styles.archPortraitRing, variantHas('medallion') && styles.archPortraitRingMedallion, { borderColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.archPortraitPhoto} circleStyle={styles.archPortraitHalo} />
        <View style={styles.archPortraitDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.archPortraitName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.archPortraitDesignation} iconSize={18} />
          <PartyName theme={theme} style={styles.archPortraitParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.archPortraitInfoLine} />
          <View style={styles.archPortraitContactRow}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.archPortraitContactPill} />)}
          </View>
        </View>
        <View style={styles.archPortraitStripeRow}>
          {theme.stripeColors.map((color, index) => <View key={`${color}-${index}`} style={[styles.archPortraitStripe, { backgroundColor: color }]} />)}
        </View>
      </View>
    );
  }

  if (layoutId === 'flag-ribbon') {
    return (
      <LinearGradient
        colors={variantHas('reverse') ? [theme.leftBackground, theme.barBackground, theme.barBackground] : [theme.barBackground, theme.leftBackground, theme.barBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileBar, styles.flagRibbonBar, compact && styles.profileBarCompact]}
      >
        <View style={[styles.flagRibbonWave, variantHas('reverse') && styles.flagRibbonWaveReverse, { backgroundColor: theme.accent }]} />
        <View style={[variantHas('reverse') ? styles.flagRibbonWaveLightReverse : styles.flagRibbonWaveLight, { backgroundColor: theme.leftBackground }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={[styles.flagRibbonPhoto, variantHas('reverse') && styles.flagRibbonPhotoReverse]} circleStyle={styles.flagRibbonHalo} />
        <View style={[styles.flagRibbonInfoCard, variantHas('reverse') && styles.flagRibbonInfoCardReverse, { backgroundColor: theme.barBackground }]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.flagRibbonName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.flagRibbonDesignation} iconSize={18} />
          <View style={styles.flagRibbonPartyRow}>
            <PartyName theme={theme} style={styles.flagRibbonParty} />
          </View>
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.flagRibbonInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.flagRibbonInfoLine} />
          ))}
        </View>
      </LinearGradient>
    );
  }

  if (layoutId === 'ticket-frame') {
    return (
      <View style={[styles.profileBar, styles.ticketFrameBar, compact && styles.profileBarCompact, { backgroundColor: variantHas('dark') ? theme.accentDark : theme.barBackground }]}>
        <View style={[styles.ticketFramePhotoPanel, { backgroundColor: theme.leftBackground }]}>
          <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.ticketFramePhoto} circleStyle={styles.ticketFrameHalo} />
        </View>
        <View style={[styles.ticketFrameNotchTop, { backgroundColor: theme.barBackground }]} />
        <View style={[styles.ticketFrameNotchBottom, { backgroundColor: theme.barBackground }]} />
        <View style={[styles.ticketFrameDivider, { borderColor: theme.accent }]} />
        <View style={styles.ticketFrameDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.ticketFrameName, variantHas('dark') && styles.ticketFrameNameDark]} />
          <DesignationLine text={data.designation} theme={theme} style={styles.ticketFrameDesignation} iconSize={18} light={variantHas('dark')} />
          <PartyName theme={theme} light={variantHas('dark')} style={styles.ticketFrameParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.ticketFrameInfoLine} iconColor={variantHas('dark') ? theme.primaryText : undefined} textStyle={variantHas('dark') && styles.ticketFrameInfoTextDark} />
          <View style={styles.ticketFrameContactRow}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.ticketFrameContactPill} />)}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'vertical-rail') {
    return (
      <View style={[styles.profileBar, styles.verticalRailBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.verticalRailAccent, { backgroundColor: theme.accentDark }]}>
          {theme.stripeColors.map((color, index) => <View key={`${color}-${index}`} style={[styles.verticalRailAccentMark, { backgroundColor: color }]} />)}
        </View>
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={[styles.verticalRailPhoto, variantHas('cut') && styles.verticalRailPhotoCut]} circleStyle={styles.verticalRailHalo} />
        <View style={[styles.verticalRailCutShape, variantHas('cut') && { backgroundColor: theme.accent }]} />
        <View style={styles.verticalRailDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.verticalRailName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.verticalRailDesignation} iconSize={18} />
          <PartyName theme={theme} style={styles.verticalRailParty} />
          <View style={[styles.verticalRailRule, { backgroundColor: theme.accent }]} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.verticalRailInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.verticalRailInfoLine} />
          ))}
        </View>
      </View>
    );
  }

  if (layoutId === 'diagonal-plaque') {
    return (
      <View style={[styles.profileBar, styles.diagonalPlaqueBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={[styles.diagonalPlaquePhoto, variantHas('right') && styles.diagonalPlaquePhotoRight]} circleStyle={styles.diagonalPlaqueHalo} />
        <View style={[styles.diagonalPlaqueAccent, variantHas('right') && styles.diagonalPlaqueAccentRight, { backgroundColor: theme.accent }]} />
        <View style={[styles.diagonalPlaqueCard, variantHas('right') && styles.diagonalPlaqueCardRight, { backgroundColor: theme.barBackground }]}>
          <View style={[styles.diagonalPlaqueNameBand, { backgroundColor: theme.accentDark }]}>
            <PosterName name={data.name} compact={compact} theme={theme} style={[styles.diagonalPlaqueName, { color: theme.barBackground }]} />
          </View>
          <DesignationLine text={data.designation} theme={theme} style={styles.diagonalPlaqueDesignation} iconSize={18} />
          <PartyName theme={theme} style={styles.diagonalPlaqueParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.diagonalPlaqueInfoLine} />
          <View style={styles.diagonalPlaqueContactRow}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.diagonalPlaqueContactPill} />)}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'window-card') {
    return (
      <View style={[styles.profileBar, styles.windowCardBar, variantHas('banner') && styles.windowCardBarBanner, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground, borderColor: theme.accent }]}>
        <View style={[styles.windowCardPhotoFrame, { backgroundColor: theme.leftBackground, borderColor: theme.accent }]}>
          <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.windowCardPhoto} circleStyle={styles.windowCardHalo} />
        </View>
        <View style={styles.windowCardDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.windowCardName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.windowCardDesignation} iconSize={18} />
          <PartyName theme={theme} style={styles.windowCardParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.windowCardInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.windowCardInfoLine} />
          ))}
        </View>
        {variantHas('banner') ? <View style={[styles.windowCardBannerStrip, { backgroundColor: theme.accent }]} /> : null}
      </View>
    );
  }

  if (layoutId === 'signature-strip') {
    return (
      <View style={[styles.profileBar, styles.signatureStripBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.signatureStripBase, variantHas('ribbon') && styles.signatureStripBaseRibbon, { backgroundColor: theme.leftBackground }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.signatureStripPhoto} circleStyle={styles.signatureStripHalo} />
        <View style={[styles.signatureStripNameBand, { backgroundColor: theme.accentDark }]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.signatureStripName, { color: theme.barBackground }]} />
        </View>
        <View style={styles.signatureStripDetails}>
          <DesignationLine text={data.designation} theme={theme} style={styles.signatureStripDesignation} iconSize={18} />
          <View style={styles.signatureStripPartyLine}>
            <PartyName theme={theme} style={styles.signatureStripParty} />
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.signatureStripLocation} />
          </View>
          <View style={styles.signatureStripContactRow}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.signatureStripContactPill} />)}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'crest-panel') {
    return (
      <LinearGradient
        colors={variantHas('royal') ? [theme.accentDark, theme.barBackground, theme.leftBackground] : [theme.leftBackground, theme.barBackground, theme.barBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileBar, styles.crestPanelBar, compact && styles.profileBarCompact]}
      >
        <View style={[styles.crestPanelSeal, variantHas('royal') && styles.crestPanelSealRoyal, { borderColor: theme.accent, backgroundColor: theme.barBackground }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.crestPanelPhoto} circleStyle={styles.crestPanelHalo} />
        <View style={styles.crestPanelDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.crestPanelName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.crestPanelDesignation} iconSize={18} />
          <PartyName theme={theme} style={styles.crestPanelParty} />
          <View style={styles.crestPanelInfoGrid}>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={14} style={styles.crestPanelInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={14} style={styles.crestPanelInfoLine} />
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (layoutId === 'overlay-slab') {
    return (
      <View style={[styles.profileBar, styles.overlaySlabBar, variantHas('corner') && styles.overlaySlabBarCorner, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
        <View style={[styles.overlaySlabAccent, { backgroundColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.overlaySlabPhoto} circleStyle={styles.overlaySlabHalo} />
        <View style={[styles.overlaySlabInfo, variantHas('corner') && styles.overlaySlabInfoCorner, { backgroundColor: theme.accentDark }]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.overlaySlabName, { color: theme.barBackground }]} />
          <View style={styles.overlaySlabMetaRow}>
            <DesignationLine text={data.designation} theme={theme} light style={styles.overlaySlabDesignation} />
            <PartyName theme={theme} light style={styles.overlaySlabParty} />
          </View>
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} iconColor={theme.barBackground} textStyle={styles.overlaySlabInfoText} style={styles.overlaySlabInfoLine} />
          {data.contactItems.map((item) => (
            <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} iconColor={theme.barBackground} textStyle={styles.overlaySlabInfoText} style={styles.overlaySlabInfoLine} />
          ))}
        </View>
      </View>
    );
  }

  if (layoutId === 'wave-panel') {
    return (
      <LinearGradient
        colors={[theme.leftBackground, theme.barBackground, theme.barBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileBar, styles.wavePanelBar, compact && styles.profileBarCompact]}
      >
        <View style={[styles.wavePanelShape, variantHas('deep') && styles.wavePanelShapeDeep, { backgroundColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.wavePanelPhoto} circleStyle={styles.wavePanelHalo} />
        <View style={styles.wavePanelDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} style={[styles.wavePanelName, variantHas('deep') && styles.wavePanelNameDeep]} />
          <DesignationLine text={data.designation} theme={theme} style={styles.wavePanelDesignation} />
          <View style={[styles.wavePanelPartyBox, { backgroundColor: theme.accent }]}>
            <PartyName theme={theme} light style={styles.wavePanelParty} />
          </View>
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.wavePanelInfoLine} />
          <View style={styles.wavePanelContactGrid}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large style={styles.wavePanelContactPill} />)}
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (layoutId === 'stacked-card') {
    return (
      <View style={[styles.profileBar, styles.stackedCardBar, compact && styles.profileBarCompact, { backgroundColor: theme.leftBackground }]}>
        <View style={[styles.stackedCardBack, variantHas('ribbon') && styles.stackedCardBackRibbon, { backgroundColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.stackedCardPhoto} circleStyle={styles.stackedCardHalo} />
        <View style={[styles.stackedCardNameCard, { backgroundColor: theme.barBackground }]}>
          <PosterName name={data.name} compact={compact} theme={theme} style={styles.stackedCardName} />
          <DesignationLine text={data.designation} theme={theme} style={styles.stackedCardDesignation} />
        </View>
        <View style={[styles.stackedCardBottom, { backgroundColor: theme.accentDark }]}>
          <PartyName theme={theme} light style={styles.stackedCardParty} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} iconColor={theme.barBackground} textStyle={styles.stackedCardInfoText} style={styles.stackedCardInfoLine} />
          <View style={styles.stackedCardContactRow}>
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} iconColor={theme.barBackground} textStyle={styles.stackedCardInfoText} style={styles.stackedCardContactLine} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'royal-overlay') {
    return (
      <View style={[styles.profileBar, styles.royalOverlayBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground, borderColor: theme.accent }]}>
        <View style={[styles.royalOverlaySeal, variantHas('gold') && styles.royalOverlaySealGold, { backgroundColor: theme.accent }]} />
        <FullHeightPhoto uri={data.photoUri} name={data.name} theme={theme} style={styles.royalOverlayPhoto} circleStyle={styles.royalOverlayHalo} />
        <View style={styles.royalOverlayDetails}>
          <View style={[styles.royalOverlayNamePlate, { borderColor: theme.accent }]}>
            <PosterName name={data.name} compact={compact} theme={theme} style={styles.royalOverlayName} />
          </View>
          <DesignationLine text={data.designation} theme={theme} style={styles.royalOverlayDesignation} />
          <PartyName theme={theme} style={styles.royalOverlayParty} />
          <View style={styles.royalOverlayInfoGrid}>
            <IconText icon="location-outline" text={data.locationLine} theme={theme} iconSize={13} style={styles.royalOverlayInfoLine} />
            {data.contactItems.map((item) => (
              <IconText key={item.key} icon={item.icon} text={item.text} theme={theme} iconSize={13} style={styles.royalOverlayInfoLine} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.profileBar, compact && styles.profileBarCompact, { backgroundColor: theme.barBackground }]}>
      <LinearGradient
        colors={[theme.leftBackground, theme.barBackground, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.circleLayoutContent}
      >
        <View style={styles.circlePhotoColumn}>
          <ProfilePhoto uri={data.photoUri} name={data.name} compact={compact} theme={theme} variant="circle" style={styles.circleLayoutPhoto} />
        </View>
        <View style={styles.circleDetails}>
          <PosterName name={data.name} compact={compact} theme={theme} />
          <DesignationLine text={data.designation} theme={theme} pill light />
          <PartyName theme={theme} />
          <IconText icon="location-outline" text={data.locationLine} theme={theme} />
          <View style={styles.contactWrap}>
            {data.contactItems.map((item) => <ContactPill key={item.key} item={item} theme={theme} large />)}
          </View>
        </View>
      </LinearGradient>
      </View>
  );
}

export default function PosterEditor({
  template,
  user,
  isSubscribed = false,
  onClose,
  onRequireSubscription,
  onRequestDownload,
  helperText,
}) {
  const viewShotRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const [customization, setCustomization] = useState(() => buildDefaultPosterCustomization(user));
  const [sheetVisible, setSheetVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [layoutPickerVisible, setLayoutPickerVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);

  useEffect(() => {
    let active = true;
    const defaults = buildDefaultPosterCustomization(user);
    setIsReady(false);
    loadPosterCustomization(template.id, user, defaults)
      .then((saved) => {
        if (!active) return;
        setCustomization(normalizePosterCustomization(saved, defaults));
        setIsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setCustomization(normalizePosterCustomization(defaults, defaults));
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, [template.id, user]);

  useEffect(() => {
    if (!isReady) return;
    savePosterCustomization(template.id, user, customization).catch(() => {});
  }, [customization, isReady, template.id, user]);

  useEffect(() => {
    let active = true;
    if (!template?.imageUrl) {
      setImageAspectRatio(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);
      return () => {
        active = false;
      };
    }

    Image.getSize(
      template.imageUrl,
      (width, height) => {
        if (!active || !width || !height) return;
        setImageAspectRatio(width / height);
      },
      () => {
        if (!active) return;
        setImageAspectRatio(CAPTURE_WIDTH / CAPTURE_POSTER_HEIGHT);
      },
    );

    return () => {
      active = false;
    };
  }, [template?.imageUrl]);

  const handleChange = (key, value) => {
    const nextValue = key === 'mobile'
      ? value.replace(/\D/g, '').slice(0, 10)
      : key === 'email'
        ? value.trim().toLowerCase().slice(0, 48)
        : key === 'designation'
          ? value.trimStart().slice(0, 38)
        : value;
    setCustomization((current) => ({ ...current, [key]: nextValue }));
  };

  const handlePickPosterPhoto = async () => {
    if (!ensureCustomizationAccess()) return;
    setPickingPhoto(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Poster photo choose karne ke liye gallery permission allow kijiye.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: PHOTO_PICKER_QUALITY,
        exif: false,
        base64: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const nextUri = await persistPosterPhoto(result.assets[0].uri);
      await deleteLocalPosterPhoto(customization.posterPhotoUri);
      setCustomization((current) => ({ ...current, posterPhotoUri: nextUri }));
    } catch (error) {
      Alert.alert('Photo failed', getFriendlyErrorMessage(error, 'Poster photo select nahi ho paayi.'));
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleRemovePosterPhoto = () => {
    deleteLocalPosterPhoto(customization.posterPhotoUri);
    setCustomization((current) => ({ ...current, posterPhotoUri: '' }));
  };

  const validateRequiredFields = () => {
    if (!customization.name.trim()) {
      Alert.alert('Name required', 'Poster customize karne ke liye name jaruri hai.');
      return false;
    }
    if (customization.district && !isValidRajasthanDistrict(customization.district)) {
      Alert.alert('District required', 'District list me se valid Rajasthan district select kijiye.');
      return false;
    }
    if (customization.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customization.email.trim())) {
      Alert.alert('Email invalid', 'Valid Gmail ya email ID daliye.');
      return false;
    }
    return true;
  };

  const ensureCustomizationAccess = () => {
    if (isSubscribed) return true;
    Alert.alert(
      'Subscription Required',
      'Poster edit aur theme choose karne ke liye pehle subscription lena hoga.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            if (onRequireSubscription) onRequireSubscription();
          },
        },
      ],
    );
    return false;
  };

  const capturePoster = async (actionType) => {
    if (!validateRequiredFields()) return '';
    if (onRequestDownload) {
      const allowed = await onRequestDownload(template, actionType);
      if (!allowed) return '';
    }
    if (!viewShotRef.current?.capture) throw new Error('Poster preview is not ready yet.');
    return viewShotRef.current.capture();
  };

  const handleDownload = async () => {
    setActionLoading('download');
    try {
      const uri = await capturePoster('download');
      if (!uri) return;
      await savePosterToGallery(uri, {
        fileName: `${(template.name || 'rlp-poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}.png`,
      });

      Alert.alert('Downloaded', 'Customized poster gallery me save ho gaya.');
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        showPermissionSettingsAlert();
        return;
      }
      Alert.alert('Download failed', getFriendlyErrorMessage(error, 'Poster download nahi ho paya.'));
    } finally {
      setActionLoading('');
    }
  };

  const handleShare = async () => {
    setActionLoading('share');
    try {
      const uri = await capturePoster('share');
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error('Sharing is not available on this device');
      }

      const safeName = (template.name || 'rlp-poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const shareUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${safeName}-${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: shareUri });

      await Sharing.shareAsync(shareUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Customized Poster',
        UTI: 'public.png',
      });
    } catch (error) {
      Alert.alert('Share failed', getFriendlyErrorMessage(error, 'Poster share nahi ho paya.'));
    } finally {
      setActionLoading('');
    }
  };

  const previewWidth = Math.min(windowWidth - 40, POSTER_PREVIEW_MAX_WIDTH);
  const compactProfileBar = previewWidth < 332;
  const selectedTheme = THEME_OPTIONS.find((theme) => theme.id === customization.themeId) || THEME_OPTIONS[0];
  const selectedLayout = LAYOUT_OPTIONS.find((layout) => layout.id === customization.layoutId) || LAYOUT_OPTIONS[0];

  return (
    <View style={styles.container}>
    <View style={styles.helperBox}>
        <Text style={styles.helperBoxTitle}>Poster Help</Text>
        <Text style={styles.helperBoxText}>• Theme par click karke color choose karein.</Text>
        <Text style={styles.helperBoxText}>• Layout par click karke different design choose karein.</Text>
        <Text style={styles.helperBoxText}>• Details se apna name, pad, mobile, email, social handle aur district edit karein.</Text>
      </View>
      <ToolButton
          icon="albums-outline"
          label="Layout"
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setLayoutPickerVisible(true);
          }}
        />
      

      <View style={styles.toolGrid}>
        <ToolButton icon="image-outline" label={pickingPhoto ? 'Selecting...' : 'Photo'} onPress={handlePickPosterPhoto} disabled={pickingPhoto} />
        <ToolButton
          icon="color-palette-outline"
          label="Theme"
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setThemePickerVisible(true);
          }}
        />
        <ViewShot
        ref={viewShotRef}
        style={styles.captureShell}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
      >
        <View style={styles.captureCanvas}>
          <Image
            source={{ uri: template.imageUrl }}
            style={[styles.posterImage, { aspectRatio: imageAspectRatio }]}
            resizeMode="cover"
          />
          <PosterProfileBar customization={customization} user={user} compact={compactProfileBar} theme={selectedTheme} layout={selectedLayout} />
        </View>
      </ViewShot>
        <ToolButton
          icon="create-outline"
          label="Details"
          onPress={() => {
            if (!ensureCustomizationAccess()) return;
            setSheetVisible(true);
          }}
        />
      </View>

      <View style={styles.exportActions}>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, styles.downloadBtn, pressed && { opacity: 0.88 }]}
          onPress={handleDownload}
          disabled={actionLoading !== ''}
        >
          <Text style={styles.downloadText}>{actionLoading === 'download' ? 'Saving...' : 'Download'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, styles.shareBtn, pressed && { opacity: 0.88 }]}
          onPress={handleShare}
          disabled={actionLoading !== ''}
        >
          <Text style={styles.exportText}>{actionLoading === 'share' ? 'Sharing...' : 'Share'}</Text>
        </Pressable>
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <ThemePicker
        visible={themePickerVisible}
        selectedThemeId={selectedTheme.id}
        onSelect={(themeId) => handleChange('themeId', themeId)}
        onClose={() => setThemePickerVisible(false)}
      />

      <LayoutPicker
        visible={layoutPickerVisible}
        selectedLayoutId={selectedLayout.id}
        onSelect={(layoutId) => handleChange('layoutId', layoutId)}
        onClose={() => setLayoutPickerVisible(false)}
        theme={selectedTheme}
      />

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>पोस्टर विवरण</Text>
            <Text style={styles.sheetSubtitle}>ये विवरण पोस्टर के नीचे वाले लेआउट में जुड़ेंगे.</Text>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.photoField}>
                <Text style={styles.fieldLabel}>पोस्टर फोटो</Text>
                <View style={styles.photoFieldRow}>
                  <View style={[styles.photoFieldPreview, { borderColor: selectedTheme.accent }]}>
                    {customization.posterPhotoUri || getUserProfilePhoto(user) ? (
                      <Image
                        source={{ uri: customization.posterPhotoUri || getUserProfilePhoto(user) }}
                        style={styles.photoFieldImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.photoFieldInitials}>{getInitials(customization.name)}</Text>
                    )}
                  </View>
                  <View style={styles.photoFieldActions}>
                    <Pressable
                      style={({ pressed }) => [styles.photoFieldBtn, pressed && { opacity: 0.82 }]}
                      onPress={handlePickPosterPhoto}
                      disabled={pickingPhoto}
                    >
                      {pickingPhoto ? (
                        <ActivityIndicator color={Colors.rlpGreen} size="small" />
                      ) : (
                        <Ionicons name="image-outline" size={18} color={Colors.rlpGreen} />
                      )}
                      <Text style={styles.photoFieldBtnText}>{pickingPhoto ? 'Selecting' : 'फोटो चुनें'}</Text>
                    </Pressable>
                    {customization.posterPhotoUri ? (
                      <Pressable
                        style={({ pressed }) => [styles.photoRemoveBtn, pressed && { opacity: 0.82 }]}
                        onPress={handleRemovePosterPhoto}
                      >
                        <Ionicons name="trash-outline" size={17} color={Colors.error} />
                        <Text style={styles.photoRemoveText}>हटाएं</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
              {FIELD_CONFIG.map((field) => (
                <CustomizationField
                  key={field.key}
                  label={field.label}
                  value={customization[field.key]}
                  onChangeText={(value) => handleChange(field.key, value)}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType}
                  required={field.required}
                  maxLength={field.maxLength}
                  autoCapitalize={field.autoCapitalize}
                />
              ))}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>जिला</Text>
                <SearchableDistrictSelect
                  value={customization.district}
                  onSelect={(value) => handleChange('district', value)}
                  placeholder="जिला खोजें और चुनें"
                />
              </View>
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable style={({ pressed }) => [styles.sheetSecondaryBtn, pressed && { opacity: 0.82 }]} onPress={() => setSheetVisible(false)}>
                <Text style={styles.sheetSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.sheetPrimaryBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  if (!validateRequiredFields()) return;
                  setSheetVisible(false);
                }}
              >
                <Text style={styles.sheetPrimaryText}>Update Preview</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', padding: 20, paddingBottom: 28 },
  captureShell: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  captureCanvas: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  posterImage: {
    width: '100%',
    backgroundColor: Colors.white,
  },
  profileBar: {
    width: '100%',
    minHeight: 168,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  profileBarCompact: {
    minHeight: 150,
  },
  profileStripeRow: {
    flexDirection: 'row',
    height: 10,
    width: '100%',
  },
  profileStripe: { flex: 1 },
  profileBarContent: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 158,
  },
  profilePhotoPanel: {
    width: '34%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
  },
  profilePhotoFrame: {
    width: 104,
    height: 124,
    maxWidth: '100%',
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoFrameCompact: {
    width: 92,
    height: 108,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profilePhotoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderBottomWidth: 3,
  },
  profilePhotoSquare: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderBottomWidth: 3,
  },
  profilePhotoRounded: {
    width: 98,
    height: 112,
    borderRadius: 18,
    borderBottomWidth: 3,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    fontFamily: FontFamily.black,
    fontSize: 32,
    color: Colors.white,
  },
  profileInitialsCompact: { fontSize: 28 },
  profileTextPanel: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAccentBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 7,
    height: '100%',
  },
  profileName: {
    fontFamily: FontFamily.black,
    fontSize: 29,
    lineHeight: 39,
    letterSpacing: 0,
    includeFontPadding: true,
  },
  profileNameCompact: {
    fontSize: 25,
    lineHeight: 34,
  },
  profileNameNoClip: {
    includeFontPadding: true,
  },
  profileDesignation: {
    marginTop: 4,
  },
  profileDesignationCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  profileParty: {
    fontFamily: FontFamily.bold,
    fontSize: 19,
    lineHeight: 25,
    marginTop: 4,
  },
  profilePartyCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  profileMetaCompact: { fontSize: 10, lineHeight: 13 },
  profileTextCentered: { textAlign: 'center' },
  profileInfoLine: { marginTop: 5 },
  profileContactWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  fullPhotoShell: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPhotoHalo: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    opacity: 0.22,
    top: 8,
    left: 12,
  },
  fullPhotoImage: {
    width: '100%',
    height: '100%',
  },
  fullPhotoInitials: {
    fontFamily: FontFamily.black,
    fontSize: 34,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 15,
  },
  iconTextLabel: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  contactPill: {
    maxWidth: '100%',
    minHeight: 20,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contactPillText: {
    flexShrink: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  contactPillLarge: {
    minHeight: 24,
    paddingHorizontal: 8,
  },
  contactPillTextLarge: {
    fontSize: 12,
    lineHeight: 15,
  },
  contactWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  designationLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    minHeight: 18,
    maxWidth: '100%',
  },
  designationLineIcon: {
    marginTop: 2,
  },
  designationLinePill: {
    alignSelf: 'flex-start',
    marginTop: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  designationLineText: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: FontFamily.bold,
    fontSize: 13,
    lineHeight: 17,
    includeFontPadding: true,
  },
  designationLinePillText: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  partyName: {
    marginTop: 5,
    fontFamily: FontFamily.black,
    fontSize: 19,
    lineHeight: 24,
  },
  bottomIdentityBand: {
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomIdentityParty: {
    flex: 1.05,
    marginTop: 0,
    fontSize: 16,
    lineHeight: 20,
  },
  bottomIdentityDesignation: {
    flex: 0.95,
    justifyContent: 'flex-end',
  },
  circleLayoutContent: {
    flex: 1,
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  circleLayoutContentClean: {
    paddingVertical: 8,
    gap: 8,
  },
  circleLayoutContentBand: {
    borderBottomWidth: 7,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  circlePhotoColumn: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePhotoColumnBold: {
    width: '34%',
  },
  circleLayoutPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  circleLayoutPhotoLarge: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  circleDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  squareGradientBar: {
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  squareGradientSoft: {
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  squareAccentRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 10,
  },
  squareAccentRailWide: {
    width: 16,
  },
  squarePhotoColumn: {
    width: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squarePhotoColumnWide: {
    width: '36%',
  },
  squareLayoutPhoto: {
    width: 106,
    height: 106,
    borderRadius: 14,
  },
  squareLayoutPhotoWide: {
    width: 114,
    height: 114,
  },
  squareDetails: {
    flex: 1,
    paddingLeft: 9,
    paddingRight: 10,
  },
  squareDesignation: {
    marginTop: 4,
  },
  squareInfoGrid: {
    marginTop: 7,
    gap: 4,
  },
  squareInfoLine: { minHeight: 17 },
  squareParty: { marginTop: 4 },
  angledBar: {
    minHeight: 188,
    overflow: 'hidden',
  },
  angledShape: {
    position: 'absolute',
    width: 164,
    height: 210,
    left: -78,
    top: -40,
    transform: [{ rotate: '15deg' }],
    opacity: 0.88,
  },
  angledShapeLight: {
    position: 'absolute',
    width: 210,
    height: 70,
    right: -40,
    bottom: -16,
    transform: [{ rotate: '-7deg' }],
  },
  angledContent: {
    flex: 1,
    minHeight: 188,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 9,
  },
  angledContentDense: {
    paddingVertical: 7,
    gap: 9,
  },
  angledPhoto: {
    width: 98,
    height: 132,
    borderRadius: 18,
  },
  angledPhotoLarge: {
    width: 104,
    height: 138,
  },
  angledDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  angledName: {
    fontSize: 24,
    lineHeight: 31,
  },
  angledDesignationRow: {
    marginTop: 2,
  },
  angledDesignation: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  angledIconLine: { marginTop: 3 },
  angledPartyName: { marginTop: 2 },
  angledContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 4,
  },
  angledContactPill: {
    width: '100%',
    maxWidth: '100%',
    minHeight: 20,
    paddingHorizontal: 6,
  },
  socialBadgeBar: {
    minHeight: 168,
    overflow: 'hidden',
  },
  socialTopLine: {
    height: 8,
    width: '100%',
  },
  socialBadgeContent: {
    flex: 1,
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  socialBadgeContentCompact: {
    paddingVertical: 7,
    gap: 8,
  },
  socialPhotoWrap: {
    width: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialPhotoWrapWide: {
    width: '35%',
  },
  socialBadgePhoto: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  socialBadgePhotoWide: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  socialDetails: {
    flex: 1,
  },
  socialDesignation: {
    marginTop: 4,
  },
  socialInfoLine: {
    marginTop: 4,
  },
  socialParty: { marginTop: 4 },
  fullPhotoAngledBar: {
    minHeight: 176,
    overflow: 'hidden',
  },
  fullPhotoAngledImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '42%',
    height: '100%',
    borderTopRightRadius: 36,
    borderBottomRightRadius: 10,
  },
  fullPhotoHeadHalo: {
    top: 6,
    left: 22,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.25,
  },
  fullPhotoDiagonal: {
    position: 'absolute',
    left: '35%',
    top: -34,
    width: 34,
    height: 230,
    transform: [{ rotate: '14deg' }],
    opacity: 0.52,
  },
  fullPhotoDiagonalClean: {
    width: 24,
    opacity: 0.3,
  },
  fullPhotoAngledDetails: {
    minHeight: 176,
    marginLeft: '42%',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 11,
  },
  fullPhotoAngledDetailsWide: {
    marginLeft: '38%',
    paddingLeft: 20,
  },
  fullPhotoName: {
    fontSize: 30,
    lineHeight: 36,
  },
  fullPhotoNameDeep: {
    fontSize: 31,
    lineHeight: 37,
  },
  fullPhotoDesignation: {
    marginTop: 4,
  },
  fullPhotoParty: {
    marginTop: 4,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 21,
  },
  fullPhotoInfoLine: {
    marginTop: 5,
  },
  fullPhotoContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  fullPhotoContactPill: {
    maxWidth: '100%',
  },
  leaderPanelBar: {
    minHeight: 176,
    overflow: 'hidden',
  },
  leaderPanelCircle: {
    position: 'absolute',
    left: -22,
    top: -12,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.18,
  },
  leaderPanelPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '39%',
    height: 176,
    borderTopRightRadius: 24,
  },
  leaderPanelHalo: {
    top: 10,
    left: 18,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  leaderPanelDetails: {
    minHeight: 176,
    marginLeft: '39%',
    paddingLeft: 14,
    paddingRight: 12,
    justifyContent: 'center',
  },
  leaderPanelDetailsWide: {
    marginLeft: '36%',
    paddingLeft: 16,
  },
  leaderPanelName: {
    fontSize: 30,
    lineHeight: 36,
  },
  leaderPanelNameBold: {
    fontSize: 31,
    lineHeight: 37,
  },
  leaderPanelDesignation: {
    marginTop: 4,
  },
  leaderPanelParty: {
    marginTop: 4,
  },
  leaderPanelDividerRow: {
    flexDirection: 'row',
    height: 5,
    marginTop: 7,
    marginBottom: 3,
    borderRadius: 99,
    overflow: 'hidden',
  },
  leaderPanelDividerRowBold: {
    height: 8,
  },
  leaderPanelDividerRowCampaign: {
    height: 7,
    marginTop: 5,
  },
  leaderPanelDivider: {
    flex: 1,
  },
  leaderPanelInfoLine: {
    marginTop: 4,
  },
  solidOverlayBar: {
    minHeight: 178,
    overflow: 'hidden',
  },
  solidOverlayBarRadius: {
    borderTopLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  solidOverlayTop: {
    minHeight: 126,
    flexDirection: 'row',
  },
  solidOverlayPhoto: {
    width: '37%',
    height: 126,
    borderBottomRightRadius: 34,
  },
  solidOverlayPhotoWide: {
    width: '42%',
  },
  solidOverlayHalo: {
    top: 10,
    left: 18,
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  solidOverlayInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 8,
  },
  solidOverlayName: {
    fontSize: 30,
    lineHeight: 36,
  },
  solidOverlayInfoLine: {
    marginTop: 5,
    minHeight: 18,
  },
  solidOverlayBottom: {
    minHeight: 42,
  },
  solidOverlayParty: {
    marginTop: 0,
    fontSize: 19,
    lineHeight: 24,
  },
  solidOverlayDesignation: {
    marginTop: 2,
  },
  splitOverlayBar: {
    minHeight: 180,
    overflow: 'hidden',
  },
  splitOverlayBarRadius: {
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 34,
  },
  splitOverlayMain: {
    minHeight: 126,
    flexDirection: 'row',
  },
  splitOverlayPhotoPane: {
    width: '38%',
    overflow: 'hidden',
    borderTopRightRadius: 26,
  },
  splitOverlayPhotoPaneWide: {
    width: '42%',
  },
  splitOverlayPhoto: {
    width: '100%',
    height: 126,
  },
  splitOverlayHalo: {
    top: 7,
    left: 14,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  splitOverlayInfoPane: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 8,
  },
  splitOverlayName: {
    fontSize: 29,
    lineHeight: 35,
  },
  splitOverlayInfoLine: {
    marginTop: 4,
    minHeight: 18,
  },
  splitOverlayBand: {
    minHeight: 42,
  },
  identityBandDense: {
    minHeight: 40,
    paddingVertical: 3,
  },
  splitOverlayDesignation: {
    marginTop: 0,
  },
  splitOverlayParty: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 23,
  },
  cornerOverlayBar: {
    minHeight: 186,
    overflow: 'hidden',
    borderTopLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  cornerOverlayBarSoft: {
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  cornerOverlayBarDual: {
    borderTopLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cornerOverlayTop: {
    minHeight: 132,
    flexDirection: 'row',
  },
  cornerPhotoPanel: {
    width: '39%',
    borderTopLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  cornerPhotoPanelWide: {
    width: '43%',
  },
  cornerOverlayPhoto: {
    width: '100%',
    height: 132,
  },
  cornerOverlayHalo: {
    top: 7,
    left: 15,
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  cornerOverlayInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 9,
  },
  cornerOverlayName: {
    fontSize: 30,
    lineHeight: 36,
  },
  cornerOverlayNameBold: {
    fontSize: 32,
    lineHeight: 38,
  },
  cornerOverlayInfoLine: {
    marginTop: 5,
    minHeight: 18,
  },
  cornerOverlayBand: {
    minHeight: 42,
    borderTopLeftRadius: 24,
  },
  reverseAngledBar: {
    minHeight: 178,
    overflow: 'hidden',
  },
  reverseAngledShape: {
    position: 'absolute',
    right: -82,
    top: -42,
    width: 168,
    height: 230,
    transform: [{ rotate: '-16deg' }],
    opacity: 0.9,
  },
  reverseAngledLight: {
    position: 'absolute',
    left: -42,
    bottom: -18,
    width: 220,
    height: 76,
    transform: [{ rotate: '7deg' }],
  },
  reverseAngledDetails: {
    minHeight: 178,
    width: '61%',
    justifyContent: 'center',
    paddingLeft: 13,
    paddingRight: 8,
    paddingVertical: 10,
  },
  reverseAngledDetailsWide: {
    width: '64%',
  },
  reverseAngledDetailsDense: {
    paddingVertical: 7,
  },
  reverseAngledName: {
    fontSize: 28,
    lineHeight: 34,
  },
  reverseAngledDesignation: {
    marginTop: 4,
  },
  reverseAngledParty: {
    marginTop: 4,
  },
  reverseAngledInfoLine: {
    marginTop: 4,
    minHeight: 18,
  },
  reverseAngledPhoto: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '39%',
    height: 178,
    borderTopLeftRadius: 34,
    borderBottomLeftRadius: 10,
  },
  reverseAngledPhotoWide: {
    width: '43%',
  },
  reverseAngledHalo: {
    top: 8,
    left: 12,
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  archPortraitBar: {
    minHeight: 186,
    overflow: 'hidden',
  },
  archPortraitBackdrop: {
    position: 'absolute',
    left: -36,
    bottom: -18,
    width: 190,
    height: 168,
    borderTopRightRadius: 96,
    borderTopLeftRadius: 96,
  },
  archPortraitRing: {
    position: 'absolute',
    left: 12,
    top: 10,
    width: 112,
    height: 128,
    borderTopLeftRadius: 58,
    borderTopRightRadius: 58,
    borderWidth: 3,
    opacity: 0.9,
  },
  archPortraitRingMedallion: {
    width: 124,
    height: 124,
    borderRadius: 62,
    top: 12,
  },
  archPortraitPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '38%',
    height: 178,
    borderTopRightRadius: 72,
  },
  archPortraitHalo: {
    top: 6,
    left: 20,
    width: 112,
    height: 112,
    borderRadius: 56,
    opacity: 0.18,
  },
  archPortraitDetails: {
    minHeight: 178,
    marginLeft: '38%',
    paddingLeft: 15,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 14,
    justifyContent: 'center',
  },
  archPortraitName: {
    fontSize: 31,
    lineHeight: 37,
  },
  archPortraitDesignation: {
    marginTop: 3,
  },
  archPortraitParty: {
    marginTop: 3,
  },
  archPortraitInfoLine: {
    marginTop: 4,
    minHeight: 18,
  },
  archPortraitContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  archPortraitContactPill: {
    maxWidth: '100%',
  },
  archPortraitStripeRow: {
    position: 'absolute',
    left: '38%',
    right: 0,
    bottom: 0,
    height: 6,
    flexDirection: 'row',
  },
  archPortraitStripe: {
    flex: 1,
  },
  flagRibbonBar: {
    minHeight: 188,
    overflow: 'hidden',
  },
  flagRibbonWave: {
    position: 'absolute',
    left: '28%',
    top: -56,
    width: 96,
    height: 260,
    transform: [{ rotate: '23deg' }],
    opacity: 0.55,
  },
  flagRibbonWaveReverse: {
    left: '34%',
    transform: [{ rotate: '-21deg' }],
  },
  flagRibbonWaveLight: {
    position: 'absolute',
    right: -28,
    bottom: -22,
    width: 238,
    height: 82,
    borderTopLeftRadius: 60,
    transform: [{ rotate: '-5deg' }],
  },
  flagRibbonWaveLightReverse: {
    position: 'absolute',
    left: -36,
    bottom: -22,
    width: 238,
    height: 82,
    borderTopRightRadius: 60,
    transform: [{ rotate: '5deg' }],
  },
  flagRibbonPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '39%',
    height: 188,
    borderTopRightRadius: 28,
  },
  flagRibbonPhotoReverse: {
    width: '36%',
    borderTopRightRadius: 60,
  },
  flagRibbonHalo: {
    top: 12,
    left: 18,
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  flagRibbonInfoCard: {
    minHeight: 160,
    marginLeft: '38%',
    marginRight: 10,
    marginVertical: 12,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 9,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  flagRibbonInfoCardReverse: {
    marginLeft: '35%',
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 34,
  },
  flagRibbonName: {
    fontSize: 30,
    lineHeight: 36,
  },
  flagRibbonDesignation: {
    marginTop: 3,
  },
  flagRibbonPartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagRibbonParty: {
    flex: 1,
    marginTop: 3,
  },
  flagRibbonInfoLine: {
    marginTop: 4,
    minHeight: 17,
  },
  ticketFrameBar: {
    minHeight: 184,
    overflow: 'hidden',
    flexDirection: 'row',
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  ticketFramePhotoPanel: {
    width: '37%',
    overflow: 'hidden',
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
  },
  ticketFramePhoto: {
    width: '100%',
    height: 184,
  },
  ticketFrameHalo: {
    top: 12,
    left: 18,
    width: 106,
    height: 106,
    borderRadius: 53,
  },
  ticketFrameNotchTop: {
    position: 'absolute',
    left: '35%',
    top: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 3,
  },
  ticketFrameNotchBottom: {
    position: 'absolute',
    left: '35%',
    bottom: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 3,
  },
  ticketFrameDivider: {
    position: 'absolute',
    left: '37%',
    top: 12,
    bottom: 12,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.82,
  },
  ticketFrameDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 9,
  },
  ticketFrameName: {
    fontSize: 30,
    lineHeight: 36,
  },
  ticketFrameNameDark: {
    color: '#FFFFFF',
  },
  ticketFrameDesignation: {
    marginTop: 3,
  },
  ticketFrameParty: {
    marginTop: 3,
  },
  ticketFrameInfoLine: {
    marginTop: 5,
    minHeight: 18,
  },
  ticketFrameInfoTextDark: {
    color: '#FFFFFF',
  },
  ticketFrameContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  ticketFrameContactPill: {
    maxWidth: '100%',
  },
  verticalRailBar: {
    minHeight: 186,
    overflow: 'hidden',
  },
  verticalRailAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 26,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    gap: 5,
  },
  verticalRailAccentMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  verticalRailPhoto: {
    position: 'absolute',
    left: 24,
    bottom: 0,
    width: '35%',
    height: 186,
    borderTopRightRadius: 28,
  },
  verticalRailPhotoCut: {
    borderTopRightRadius: 60,
    borderBottomRightRadius: 16,
  },
  verticalRailHalo: {
    top: 8,
    left: 18,
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  verticalRailCutShape: {
    position: 'absolute',
    left: '33%',
    top: -24,
    width: 34,
    height: 236,
    transform: [{ rotate: '12deg' }],
    opacity: 0.48,
  },
  verticalRailDetails: {
    minHeight: 186,
    marginLeft: '40%',
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  verticalRailName: {
    fontSize: 30,
    lineHeight: 36,
  },
  verticalRailDesignation: {
    marginTop: 3,
  },
  verticalRailParty: {
    marginTop: 3,
  },
  verticalRailRule: {
    height: 5,
    borderRadius: 99,
    marginTop: 6,
    marginBottom: 1,
    width: '84%',
  },
  verticalRailInfoLine: {
    marginTop: 4,
    minHeight: 17,
  },
  diagonalPlaqueBar: {
    minHeight: 190,
    overflow: 'hidden',
  },
  diagonalPlaquePhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '40%',
    height: 190,
    borderTopRightRadius: 42,
  },
  diagonalPlaquePhotoRight: {
    width: '37%',
    borderTopRightRadius: 16,
  },
  diagonalPlaqueHalo: {
    top: 10,
    left: 18,
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  diagonalPlaqueAccent: {
    position: 'absolute',
    left: '32%',
    top: 0,
    width: 58,
    height: 220,
    transform: [{ rotate: '13deg' }],
    opacity: 0.62,
  },
  diagonalPlaqueAccentRight: {
    left: '36%',
    transform: [{ rotate: '-13deg' }],
  },
  diagonalPlaqueCard: {
    minHeight: 166,
    marginLeft: '38%',
    marginRight: 10,
    marginVertical: 12,
    borderRadius: 24,
    borderTopLeftRadius: 6,
    padding: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  diagonalPlaqueCardRight: {
    marginLeft: '36%',
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 8,
  },
  diagonalPlaqueNameBand: {
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 4,
  },
  diagonalPlaqueName: {
    fontSize: 28,
    lineHeight: 34,
  },
  diagonalPlaqueDesignation: {
    marginTop: 2,
  },
  diagonalPlaqueParty: {
    marginTop: 2,
  },
  diagonalPlaqueInfoLine: {
    marginTop: 4,
    minHeight: 17,
  },
  diagonalPlaqueContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  diagonalPlaqueContactPill: {
    maxWidth: '100%',
  },
  windowCardBar: {
    minHeight: 188,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 3,
    borderRadius: 24,
    padding: 7,
  },
  windowCardBarBanner: {
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  windowCardPhotoFrame: {
    width: '36%',
    borderWidth: 2,
    borderRadius: 22,
    overflow: 'hidden',
  },
  windowCardPhoto: {
    width: '100%',
    height: 168,
  },
  windowCardHalo: {
    top: 8,
    left: 14,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  windowCardDetails: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 4,
  },
  windowCardName: {
    fontSize: 29,
    lineHeight: 35,
  },
  windowCardDesignation: {
    marginTop: 3,
  },
  windowCardParty: {
    marginTop: 3,
  },
  windowCardInfoLine: {
    marginTop: 4,
    minHeight: 17,
  },
  windowCardBannerStrip: {
    position: 'absolute',
    left: '42%',
    right: 0,
    bottom: 0,
    height: 8,
    opacity: 0.72,
  },
  signatureStripBar: {
    minHeight: 190,
    overflow: 'hidden',
  },
  signatureStripBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    borderTopLeftRadius: 36,
  },
  signatureStripBaseRibbon: {
    height: 78,
    transform: [{ rotate: '-2deg' }],
    bottom: -8,
  },
  signatureStripPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '37%',
    height: 190,
    borderTopRightRadius: 56,
  },
  signatureStripHalo: {
    top: 8,
    left: 18,
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  signatureStripNameBand: {
    position: 'absolute',
    left: '31%',
    right: 8,
    top: 13,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  signatureStripName: {
    fontSize: 31,
    lineHeight: 37,
  },
  signatureStripDetails: {
    minHeight: 190,
    marginLeft: '38%',
    paddingLeft: 12,
    paddingRight: 10,
    paddingTop: 62,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  signatureStripDesignation: {
    marginTop: 0,
  },
  signatureStripPartyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  signatureStripParty: {
    flex: 1,
    marginTop: 0,
  },
  signatureStripLocation: {
    flex: 0.9,
  },
  signatureStripContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  signatureStripContactPill: {
    maxWidth: '100%',
  },
  crestPanelBar: {
    minHeight: 188,
    overflow: 'hidden',
  },
  crestPanelSeal: {
    position: 'absolute',
    left: 10,
    top: 12,
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 5,
    opacity: 0.72,
  },
  crestPanelSealRoyal: {
    width: 136,
    height: 136,
    borderRadius: 68,
    opacity: 0.88,
  },
  crestPanelPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '39%',
    height: 188,
    borderTopRightRadius: 68,
  },
  crestPanelHalo: {
    top: 6,
    left: 16,
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  crestPanelDetails: {
    minHeight: 188,
    marginLeft: '39%',
    paddingLeft: 15,
    paddingRight: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  crestPanelName: {
    fontSize: 31,
    lineHeight: 37,
  },
  crestPanelDesignation: {
    marginTop: 3,
  },
  crestPanelParty: {
    marginTop: 3,
  },
  crestPanelInfoGrid: {
    marginTop: 4,
    gap: 3,
  },
  crestPanelInfoLine: {
    minHeight: 17,
  },
  overlaySlabBar: {
    minHeight: 188,
    overflow: 'hidden',
  },
  overlaySlabBarCorner: {
    borderTopLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  overlaySlabAccent: {
    position: 'absolute',
    left: '28%',
    right: -24,
    top: -24,
    height: 92,
    transform: [{ rotate: '-5deg' }],
    opacity: 0.28,
  },
  overlaySlabPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '38%',
    height: 188,
    borderTopRightRadius: 56,
  },
  overlaySlabHalo: {
    top: 8,
    left: 18,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  overlaySlabInfo: {
    minHeight: 156,
    marginLeft: '34%',
    marginRight: 8,
    marginTop: 16,
    marginBottom: 12,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingLeft: 22,
    paddingRight: 11,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  overlaySlabInfoCorner: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 8,
  },
  overlaySlabName: {
    fontSize: 29,
    lineHeight: 36,
  },
  overlaySlabMetaRow: {
    marginTop: 2,
    gap: 2,
  },
  overlaySlabDesignation: {
    marginTop: 0,
  },
  overlaySlabParty: {
    marginTop: 0,
    fontSize: 15,
    lineHeight: 20,
  },
  overlaySlabInfoLine: {
    marginTop: 3,
    minHeight: 16,
  },
  overlaySlabInfoText: {
    color: '#FFFFFF',
  },
  wavePanelBar: {
    minHeight: 188,
    overflow: 'hidden',
  },
  wavePanelShape: {
    position: 'absolute',
    left: '30%',
    top: -58,
    width: 120,
    height: 280,
    borderRadius: 70,
    transform: [{ rotate: '21deg' }],
    opacity: 0.34,
  },
  wavePanelShapeDeep: {
    width: 146,
    opacity: 0.46,
  },
  wavePanelPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '40%',
    height: 188,
    borderTopRightRadius: 78,
  },
  wavePanelHalo: {
    top: 8,
    left: 18,
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  wavePanelDetails: {
    minHeight: 188,
    marginLeft: '40%',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  wavePanelName: {
    fontSize: 30,
    lineHeight: 37,
  },
  wavePanelNameDeep: {
    fontSize: 31,
  },
  wavePanelDesignation: {
    marginTop: 2,
  },
  wavePanelPartyBox: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginTop: 3,
  },
  wavePanelParty: {
    marginTop: 0,
    fontSize: 14,
    lineHeight: 18,
  },
  wavePanelInfoLine: {
    marginTop: 4,
  },
  wavePanelContactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 4,
  },
  wavePanelContactPill: {
    maxWidth: '100%',
    minHeight: 20,
  },
  stackedCardBar: {
    minHeight: 190,
    overflow: 'hidden',
  },
  stackedCardBack: {
    position: 'absolute',
    left: '35%',
    right: -10,
    top: 12,
    bottom: 36,
    borderTopLeftRadius: 36,
    borderBottomLeftRadius: 10,
    opacity: 0.18,
  },
  stackedCardBackRibbon: {
    transform: [{ rotate: '-3deg' }],
    bottom: 28,
  },
  stackedCardPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '37%',
    height: 190,
    borderTopRightRadius: 42,
  },
  stackedCardHalo: {
    top: 9,
    left: 18,
    width: 106,
    height: 106,
    borderRadius: 53,
  },
  stackedCardNameCard: {
    minHeight: 82,
    marginLeft: '36%',
    marginRight: 10,
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  stackedCardName: {
    fontSize: 30,
    lineHeight: 37,
  },
  stackedCardDesignation: {
    marginTop: 1,
  },
  stackedCardBottom: {
    minHeight: 82,
    marginLeft: '34%',
    marginRight: 0,
    marginTop: 4,
    borderTopLeftRadius: 26,
    paddingLeft: 22,
    paddingRight: 10,
    paddingVertical: 6,
  },
  stackedCardParty: {
    marginTop: 0,
    fontSize: 15,
    lineHeight: 19,
  },
  stackedCardInfoLine: {
    marginTop: 2,
  },
  stackedCardInfoText: {
    color: '#FFFFFF',
  },
  stackedCardContactRow: {
    gap: 1,
    marginTop: 2,
  },
  stackedCardContactLine: {
    minHeight: 15,
  },
  royalOverlayBar: {
    minHeight: 190,
    overflow: 'hidden',
    borderWidth: 2,
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  royalOverlaySeal: {
    position: 'absolute',
    left: 12,
    top: 10,
    width: 126,
    height: 126,
    borderRadius: 63,
    opacity: 0.18,
  },
  royalOverlaySealGold: {
    opacity: 0.28,
    transform: [{ scale: 1.08 }],
  },
  royalOverlayPhoto: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '38%',
    height: 188,
    borderTopRightRadius: 62,
  },
  royalOverlayHalo: {
    top: 8,
    left: 18,
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  royalOverlayDetails: {
    minHeight: 188,
    marginLeft: '38%',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  royalOverlayNamePlate: {
    borderLeftWidth: 4,
    paddingLeft: 8,
    marginBottom: 3,
  },
  royalOverlayName: {
    fontSize: 30,
    lineHeight: 37,
  },
  royalOverlayDesignation: {
    marginTop: 1,
  },
  royalOverlayParty: {
    marginTop: 2,
  },
  royalOverlayInfoGrid: {
    marginTop: 3,
    gap: 2,
  },
  royalOverlayInfoLine: {
    minHeight: 16,
  },
  helperBox: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#FFF4D6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F2D27A',
  },
  helperBoxTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  helperBoxText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onSurfaceVariant,
    marginTop: 3,
  },
  themeList: { paddingBottom: 8, gap: 10 },
  themeCard: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
  },
  themeCardActive: {
    borderColor: Colors.rlpGreen,
    backgroundColor: Colors.primaryContainer,
  },
  layoutGroupCard: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 14,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  layoutGroupHeader: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layoutVariantList: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
    backgroundColor: Colors.surfaceContainerLow,
  },
  layoutVariantRow: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
  },
  layoutVariantRowActive: {
    backgroundColor: Colors.primaryContainer,
  },
  layoutVariantDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  layoutVariantLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.onSurface,
  },
  themePreview: {
    width: 88,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  themePreviewPhoto: {
    width: 28,
    height: '100%',
  },
  themePreviewTextWrap: {
    flex: 1,
    paddingHorizontal: 6,
  },
  themePreviewAccent: {
    width: 5,
    height: '100%',
  },
  themePreviewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  themePreviewMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
  },
  themeContent: { flex: 1 },
  themeLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  themeHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  layoutPreview: {
    width: 88,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  layoutPreviewPhoto: {
    width: 30,
    height: '100%',
    borderWidth: 0,
  },
  layoutPreviewPhotoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoSquare: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoRounded: {
    width: 30,
    height: 42,
    borderRadius: 9,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoFull: {
    width: 34,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 6,
  },
  layoutPreviewPhotoArch: {
    width: 34,
    height: 45,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 2,
    marginLeft: 4,
    alignSelf: 'flex-end',
  },
  layoutPreviewPhotoWave: {
    width: 38,
    height: '100%',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '-4deg' }],
  },
  layoutPreviewPhotoTicket: {
    width: 34,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoRail: {
    width: 28,
    height: '100%',
    borderLeftWidth: 5,
  },
  layoutPreviewPhotoDiagonal: {
    width: 38,
    height: '100%',
    borderTopRightRadius: 20,
    transform: [{ rotate: '5deg' }],
  },
  layoutPreviewPhotoWindow: {
    width: 34,
    height: 42,
    borderRadius: 10,
    borderWidth: 3,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewPhotoSignature: {
    width: 36,
    height: '100%',
    borderTopRightRadius: 26,
    borderBottomRightRadius: 5,
  },
  layoutPreviewPhotoCrest: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    marginLeft: 5,
    alignSelf: 'center',
  },
  layoutPreviewLines: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  layoutPreviewLineStrong: { width: '84%', height: 8, borderRadius: 99 },
  layoutPreviewLine: { width: '64%', height: 6, borderRadius: 99 },
  layoutPreviewLineSmall: { width: '76%', height: 5, borderRadius: 99, opacity: 0.5 },
  toolGrid: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 18,
    backgroundColor: Colors.rlpGreen,
  },
  toolBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 130,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: Colors.white,
  },
  toolBtnDisabled: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  toolText: { flexShrink: 1, fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  toolTextDisabled: { color: Colors.outline },
  exportActions: { width: '100%', maxWidth: POSTER_PREVIEW_MAX_WIDTH, flexDirection: 'row', gap: 12, marginTop: 12 },
  exportBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  downloadBtn: { backgroundColor: Colors.rlpYellow },
  shareBtn: { backgroundColor: Colors.onPrimaryContainer },
  exportText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
  downloadText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.onSurface },
  helperText: {
    width: '100%',
    maxWidth: POSTER_PREVIEW_MAX_WIDTH,
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '82%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.outlineVariant,
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  sheetSubtitle: { marginTop: 6, fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },
  sheetScroll: { marginTop: 16 },
  sheetContent: { paddingBottom: 8, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  requiredMark: { color: Colors.error },
  photoField: { gap: 8 },
  photoFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 10,
  },
  photoFieldPreview: {
    width: 70,
    height: 86,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.rlpGreen,
  },
  photoFieldImage: {
    width: '100%',
    height: '100%',
  },
  photoFieldInitials: {
    fontFamily: FontFamily.black,
    fontSize: 24,
    color: Colors.white,
  },
  photoFieldActions: { flex: 1, gap: 8 },
  photoFieldBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  photoFieldBtnText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurface },
  photoRemoveBtn: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  photoRemoveText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.error },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  sheetSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  sheetSecondaryText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.onSurfaceVariant },
  sheetPrimaryBtn: {
    flex: 1.4,
    backgroundColor: Colors.rlpGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetPrimaryText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.white },
});
