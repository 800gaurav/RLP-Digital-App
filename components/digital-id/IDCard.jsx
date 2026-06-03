import React from 'react';
import { Image as RNImage } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text,
} from 'react-native-svg';
import { API_BASE_URL } from '../../services/config';

const bottleAsset = RNImage.resolveAssetSource(require('../../assets/rlp_bottle_badge.png')).uri;
const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1686;

const OUTER_GREEN = '#0a8d25';
const DARK_GREEN = '#0a6f1f';
const MID_GREEN = '#1fa436';
const PAPER = '#fbf8ea';
const LINE_GREEN = '#9fd389';
const YELLOW = '#f4cd21';
const ORANGE = '#f28d13';
const RED = '#c41517';
const BLACK = '#111111';

function clampFontSize(text = '', maxChars, maxSize, minSize) {
  if (!text) return maxSize;
  if (text.length <= maxChars) return maxSize;
  const ratio = maxChars / text.length;
  return Math.max(minSize, Math.floor(maxSize * ratio));
}

function fitText(text = '', maxChars) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return text.slice(0, maxChars);
  return `${text.slice(0, maxChars - 1)}…`;
}

function formatValue(value, fallback) {
  const cleaned = `${value || ''}`.trim();
  return cleaned || fallback;
}

function buildPhotoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  if (/^https?:\/\//i.test(uri) || /^file:/i.test(uri) || /^data:/i.test(uri)) return uri;
  return `${apiOrigin}${uri.startsWith('/') ? uri : `/${uri}`}`;
}

function drawBottle(x, y, width, height, opacity = 1) {
  return (
    <SvgImage
      x={x}
      y={y}
      width={width}
      height={height}
      href={{ uri: bottleAsset }}
      opacity={opacity}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function DetailIcon({ type, cx, cy }) {
  const r = 28;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={MID_GREEN} />
      {type === 'name' && (
        <G fill="#ffffff">
          <Circle cx={cx} cy={cy - 10} r={10} />
          <Path d={`M ${cx - 18} ${cy + 16} q 18 -18 36 0 v 8 h -36 z`} />
        </G>
      )}
      {type === 'district' && (
        <G fill="#ffffff">
          <Path d={`M ${cx} ${cy - 18} c -12 0 -20 9 -20 20 c 0 15 20 33 20 33 s 20 -18 20 -33 c 0 -11 -8 -20 -20 -20 z`} />
          <Circle cx={cx} cy={cy + 2} r={7} fill={MID_GREEN} />
        </G>
      )}
      {type === 'assembly' && (
        <G stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d={`M ${cx - 20} ${cy - 10} h 40`} />
          <Path d={`M ${cx - 22} ${cy - 10} l 22 -16 l 22 16`} />
          <Path d={`M ${cx - 18} ${cy + 16} h 36`} />
          <Path d={`M ${cx - 12} ${cy - 6} v 20 M ${cx} ${cy - 6} v 20 M ${cx + 12} ${cy - 6} v 20`} />
        </G>
      )}
      {type === 'mobile' && (
        <G transform={`rotate(-28 ${cx} ${cy})`}>
          <Rect x={cx - 10} y={cy - 20} width="20" height="40" rx="5" fill="#ffffff" />
          <Rect x={cx - 6} y={cy - 14} width="12" height="24" rx="2" fill={MID_GREEN} />
          <Circle cx={cx} cy={cy + 14} r="2.5" fill={MID_GREEN} />
        </G>
      )}
      {type === 'category' && (
        <G fill="#ffffff">
          <Circle cx={cx - 10} cy={cy - 6} r={8} />
          <Circle cx={cx + 10} cy={cy - 6} r={8} />
          <Circle cx={cx} cy={cy - 14} r={8} />
          <Path d={`M ${cx - 23} ${cy + 18} q 13 -16 26 0 v 8 h -26 z`} />
          <Path d={`M ${cx - 4} ${cy + 18} q 13 -16 26 0 v 8 h -26 z`} />
          <Path d={`M ${cx - 14} ${cy + 12} q 14 -18 28 0 v 8 h -28 z`} />
        </G>
      )}
    </G>
  );
}

function DetailsRow({ index, icon, label, value, color = BLACK }) {
  const top = 1138 + (index * 68);
  const maxChars = label === 'Assembly' ? 24 : 26;
  const valueText = fitText(value, maxChars);
  const fontSize = clampFontSize(valueText, label === 'Assembly' ? 20 : 24, 34, 24);

  return (
    <G>
      <DetailIcon type={icon} cx={104} cy={top + 16} />
      <Text x="170" y={top + 24} fontSize="34" fontWeight="800" fill={BLACK}>{label}</Text>
      <Text x="455" y={top + 24} fontSize="36" fontWeight="700" fill={BLACK}>:</Text>
      <Text x="520" y={top + 24} fontSize={fontSize} fontWeight="800" fill={color}>{valueText}</Text>
      <Line x1="164" y1={top + 44} x2="840" y2={top + 44} stroke={LINE_GREEN} strokeWidth="3" />
    </G>
  );
}

export default function IDCard({ user }) {
  const fullName = formatValue(user?.fullName, 'RLP ADMIN').toUpperCase();
  const district = formatValue(user?.district, 'JAIPUR').toUpperCase();
  const assembly = formatValue(user?.vidhansabha, 'JAIPUR').toUpperCase();
  const mobile = formatValue(user?.mobileNumber, '9999999999');
  const category = formatValue(user?.category, 'GENERAL').toUpperCase();
  const membershipType = formatValue(user?.membershipType, 'Member');
  const photoUri = buildPhotoUri(user?.photoUrl || user?.profilePhoto || user?.photo);

  const titleText = fitText('राष्ट्रीय लोकतांत्रिक पार्टी', 28);
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
      <Defs>
        <LinearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#0f8426" />
          <Stop offset="0.48" stopColor="#d6fb66" />
          <Stop offset="1" stopColor="#70d71f" />
        </LinearGradient>
        <LinearGradient id="headerWave" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <Stop offset="0.5" stopColor="#f4ff77" stopOpacity="0.96" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
        </LinearGradient>
        <LinearGradient id="photoFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#42cf38" />
          <Stop offset="1" stopColor="#31c931" />
        </LinearGradient>
        <LinearGradient id="flagFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#87de3a" />
          <Stop offset="1" stopColor="#4ccf35" />
        </LinearGradient>
        <LinearGradient id="crowdFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a6e884" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#61c43a" stopOpacity="0.42" />
        </LinearGradient>
        <LinearGradient id="badgeGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#138c25" />
          <Stop offset="1" stopColor="#066318" />
        </LinearGradient>
        <LinearGradient id="footerGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#087a1b" />
          <Stop offset="1" stopColor="#0c8f21" />
        </LinearGradient>
        {/* ── Ribbon gradient for RLP badge ── */}
        <LinearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1fa436" />
          <Stop offset="1" stopColor="#0a6f1f" />
        </LinearGradient>
        <ClipPath id="cardClip">
          <Rect x="14" y="14" width="1052" height="1658" rx="52" ry="52" />
        </ClipPath>
        <ClipPath id="photoClip">
          <Rect x="334" y="528" width="412" height="532" rx="22" ry="22" />
        </ClipPath>
        {/* Crowd silhouette clip */}
        <ClipPath id="crowdClip">
          <Rect x="808" y="530" width="228" height="360" />
        </ClipPath>
      </Defs>

      <G clipPath="url(#cardClip)">
        {/* ── Card background ── */}
        <Rect x="14" y="14" width="1052" height="1658" rx="52" ry="52" fill={OUTER_GREEN} />
        <Rect x="32" y="32" width="1016" height="1640" rx="42" ry="42" fill={PAPER} />

        {/* ══════════════════════════════════════
            HEADER — green gradient + wave
        ══════════════════════════════════════ */}
        <Rect x="32" y="32" width="1016" height="182" fill="url(#headerGradient)" />
        <Path
          d="M32 126 C140 174 258 172 360 136 C470 98 612 102 728 138 C844 174 944 176 1048 126 L1048 216 L32 216 Z"
          fill={MID_GREEN}
        />
        <Path
          d="M32 138 C146 182 268 178 370 144 C486 106 610 106 726 146 C846 184 944 182 1048 136"
          fill="none"
          stroke="url(#headerWave)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <Path
          d="M32 160 C154 204 284 200 390 168 C506 132 622 132 740 170 C856 206 950 204 1048 160"
          fill="none"
          stroke="#95f12d"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Bottle logo circle in header */}
        {drawBottle(446, 38, 188, 188)}

        {/* ══════════════════════════════════════
            PARTY NAME
        ══════════════════════════════════════ */}
        <Text
          x="540" y="328"
          textAnchor="middle"
          fill={DARK_GREEN}
          fontSize="72"
          fontWeight="900"
        >
          {titleText}
        </Text>
        {/* Tricolor decorative lines + slogan */}
        {/* Left tricolor */}
        <Line x1="60"  y1="400" x2="248" y2="400" stroke="#ff9933" strokeWidth="7" strokeLinecap="round" />
        <Line x1="60"  y1="414" x2="248" y2="414" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <Line x1="60"  y1="428" x2="248" y2="428" stroke="#138808" strokeWidth="7" strokeLinecap="round" />
        {/* Right tricolor */}
        <Line x1="832" y1="400" x2="1020" y2="400" stroke="#ff9933" strokeWidth="7" strokeLinecap="round" />
        <Line x1="832" y1="414" x2="1020" y2="414" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <Line x1="832" y1="428" x2="1020" y2="428" stroke="#138808" strokeWidth="7" strokeLinecap="round" />

        <Text x="540" y="428" textAnchor="middle" fill="#162818" fontSize="34" fontWeight="700">
          स्वच्छ • सरल • समर्पित
        </Text>

        {/* ══════════════════════════════════════
            LEFT DECOR — bottle circle + text
        ══════════════════════════════════════ */}
        {drawBottle(42, 560, 226, 226)}

        <Text x="155" y="914" textAnchor="middle" fill={DARK_GREEN} fontSize="28" fontWeight="800">
          Our Resolve
        </Text>
        <Text x="155" y="956" textAnchor="middle" fill={DARK_GREEN} fontSize="28" fontWeight="800">
          Your Rights
        </Text>
        {/* underline swash */}
        <Path
          d="M95 994 C128 982 170 982 206 994"
          fill="none"
          stroke={MID_GREEN}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* ══════════════════════════════════════
            PHOTO FRAME
        ══════════════════════════════════════ */}
        {/* white outer glow frame */}
        <Rect x="322" y="516" width="436" height="556" rx="30" fill="#ffffff" opacity="0.5" />
        <Rect x="326" y="520" width="428" height="548" rx="26" fill="#ffffff" />
        <Rect x="334" y="528" width="412" height="532" rx="22" fill="url(#photoFill)" />
        {photoUri ? (
          <SvgImage
            href={{ uri: photoUri }}
            x="334" y="528"
            width="412" height="532"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#photoClip)"
          />
        ) : (
          <Text x="540" y="840" textAnchor="middle" fill="#ffffff" fontSize="230" fontWeight="900">
            R
          </Text>
        )}

        {/* ══════════════════════════════════════
            RIGHT DECOR — flag + pole + crowd + RLP badge
        ══════════════════════════════════════ */}
        <G transform="translate(0 -70)">

        {/* Flag pole */}
        <Line x1="858" y1="590" x2="858" y2="890" stroke="#8b8867" strokeWidth="6" />

        {/* Flag */}
        <Path
          d="M858 594 L1042 594 L1042 706 Q950 680 858 706 Z"
          fill="url(#flagFill)"
          stroke="#2e9633"
          strokeWidth="4"
        />
        {/* Bottle logo inside flag */}
        {drawBottle(920, 610, 80, 80)}

        {/* Crowd silhouette (people + hands) */}
        <G clipPath="url(#crowdClip)" opacity="0.30">
          {/* crowd people bodies */}
          <Circle cx="855" cy="820" r="22" fill="#3a9e2a" />
          <Rect x="840" y="840" width="30" height="90" rx="14" fill="#3a9e2a" />
          <Circle cx="900" cy="800" r="20" fill="#3a9e2a" />
          <Rect x="886" y="818" width="28" height="110" rx="13" fill="#3a9e2a" />
          <Circle cx="944" cy="812" r="21" fill="#3a9e2a" />
          <Rect x="930" y="830" width="28" height="98" rx="13" fill="#3a9e2a" />
          <Circle cx="990" cy="796" r="20" fill="#3a9e2a" />
          <Rect x="976" y="814" width="28" height="114" rx="13" fill="#3a9e2a" />
          {/* raised hands / flags */}
          <Rect x="868" y="760" width="8" height="52" rx="4" fill="#3a9e2a" />
          <Path d="M 866 760 L 876 744 L 896 752 L 876 762 Z" fill="#3a9e2a" />
          <Rect x="960" y="752" width="8" height="52" rx="4" fill="#3a9e2a" />
          <Path d="M 958 752 L 968 736 L 988 744 L 968 754 Z" fill="#3a9e2a" />
          {/* second row */}
          <Circle cx="876" cy="890" r="17" fill="#3a9e2a" />
          <Rect x="863" y="904" width="25" height="72" rx="11" fill="#3a9e2a" />
          <Circle cx="926" cy="878" r="17" fill="#3a9e2a" />
          <Rect x="913" y="892" width="25" height="84" rx="11" fill="#3a9e2a" />
          <Circle cx="972" cy="886" r="17" fill="#3a9e2a" />
          <Rect x="959" y="900" width="25" height="76" rx="11" fill="#3a9e2a" />
        </G>

        {/* RLP badge / rosette */}
        {/* outer ring */}
        <Circle cx="920" cy="1048" r="96" fill="#95d84a" />
        {/* ribbon left tail */}
        <Path
          d="M 872 1126 L 858 1192 L 882 1162 L 906 1192 Z"
          fill="url(#ribbonGrad)"
        />
        {/* ribbon right tail */}
        <Path
          d="M 968 1126 L 982 1192 L 958 1162 L 934 1192 Z"
          fill="url(#ribbonGrad)"
        />
        {/* inner green circle */}
        <Circle cx="920" cy="1048" r="80" fill="#0a7620" stroke="#cbdf6f" strokeWidth="6" />
        {/* RLP text */}
        <Text x="920" y="1072" textAnchor="middle" fill="#ffffff" fontSize="68" fontWeight="900">
          RLP
        </Text>
        {/* stars above badge */}
        <Text x="860" y="966" textAnchor="middle" fill={YELLOW} fontSize="36" fontWeight="900">★</Text>
        <Text x="920" y="952" textAnchor="middle" fill={YELLOW} fontSize="44" fontWeight="900">★</Text>
        <Text x="980" y="966" textAnchor="middle" fill={YELLOW} fontSize="36" fontWeight="900">★</Text>
        <Text x="820" y="990" textAnchor="middle" fill={YELLOW} fontSize="30" fontWeight="900">★</Text>
        <Text x="1020" y="990" textAnchor="middle" fill={YELLOW} fontSize="30" fontWeight="900">★</Text>
        </G>

        {/* ══════════════════════════════════════
            WATERMARK bottle (faint, behind details)
        ══════════════════════════════════════ */}
        <G opacity="0.10">
          {drawBottle(740, 1140, 180, 200)}
        </G>

        {/* ══════════════════════════════════════
            DETAILS ROWS
        ══════════════════════════════════════ */}
        <DetailsRow index={0} icon="name"     label="Name"      value={fullName}  color={RED} />
        <DetailsRow index={1} icon="district" label="District"  value={district} />
        <DetailsRow index={2} icon="assembly" label="Assembly"  value={assembly} />
        <DetailsRow index={3} icon="mobile"   label="Mobile No" value={mobile} />
        <DetailsRow index={4} icon="category" label="Category"  value={category} />

        {/* ══════════════════════════════════════
            BOTTOM SECTION — pad label + membership + seal + signature
        ══════════════════════════════════════ */}

        {/* पद / सदस्यता label */}
        <Text x="70" y="1518" fill={DARK_GREEN} fontSize="31" fontWeight="900">
          Post / Membership
        </Text>

        {/* Membership badge */}
        <Rect x="70" y="1534" width="282" height="80" rx="20" fill="url(#badgeGradient)" />
        <Text
          x="222" y="1588"
          textAnchor="middle"
          fill="#ffffff"
          fontSize={clampFontSize(membershipType, 6, 52, 30)}
          fontWeight="900"
        >
          {fitText(membershipType, 8)}
        </Text>

        {/* RLP circular seal (stamp style) */}
        <G opacity="0.92">
          <Circle cx="540" cy="1574" r="62" fill="#ffffff" stroke="#2f42d0" strokeWidth="5" />
          <Circle cx="540" cy="1574" r="46" fill="none"    stroke="#2f42d0" strokeWidth="3" />
          <Text x="540" y="1548" textAnchor="middle" fill="#2f42d0" fontSize="10" fontWeight="800">RASHTRIYA</Text>
          <Text x="540" y="1562" textAnchor="middle" fill="#2f42d0" fontSize="10" fontWeight="800">LOKTANTRIK PARTY</Text>
          {/* RLP centre */}
          <Text x="540" y="1594" textAnchor="middle" fill="#2f42d0" fontSize="38" fontWeight="900">RLP</Text>
          {/* bottom dots */}
          <Circle cx="500" cy="1614" r="4" fill="#2f42d0" />
          <Circle cx="540" cy="1624" r="4" fill="#2f42d0" />
          <Circle cx="580" cy="1614" r="4" fill="#2f42d0" />
          {/* bottom stars */}
          <Text x="516" y="1618" textAnchor="middle" fill="#2f42d0" fontSize="11" fontWeight="900">★</Text>
          <Text x="564" y="1618" textAnchor="middle" fill="#2f42d0" fontSize="11" fontWeight="900">★</Text>
        </G>

        {/* Signature area */}
        <G opacity="0.96">
          {/* signature scribble */}
          <Path
            d="M 760 1560 C 800 1538 848 1520 900 1510 C 882 1542 866 1572 856 1608"
            fill="none" stroke={BLACK} strokeWidth="5" strokeLinecap="round"
          />
          <Path
            d="M 730 1612 C 796 1580 868 1552 942 1540"
            fill="none" stroke={BLACK} strokeWidth="4" strokeLinecap="round"
          />
          {/* "Shahan" cursive approximation */}
          
          <Text x="856" y="1628" textAnchor="middle" fill={DARK_GREEN} fontSize="32" fontWeight="900">
            President
          </Text>
          <Text x="856" y="1660" textAnchor="middle" fill={BLACK} fontSize="28" fontWeight="700">
            Rashtriya Loktantrik Party
          </Text>
        </G>

      </G>
    </Svg>
  );
}
