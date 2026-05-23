import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPadadhikari } from '../../services/padadhikari.service';
import OfficialCard from '../../components/padadhikari/OfficialCard';
import AppBottomNav from '../../components/navigation/AppBottomNav';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const RANK_ORDER = ['national', 'state', 'district'];
const RANK_LABELS = { national: 'National', state: 'State', district: 'District' };

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyText}>Koi padadhikari nahi mile</Text>
    </View>
  );
}

export default function PadadhikariScreen() {
  const [hierarchyMode, setHierarchyMode] = useState(false);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: officials = [], refetch } = useQuery({ queryKey: ['padadhikari'], queryFn: () => getPadadhikari() });

  const handleRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const handleCardPress = (official) => { router.push({ pathname: '/padadhikari/[id]', params: { id: official.id } }); };

  const filteredOfficials = officials.filter((official) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [official.fullName, official.designation, official.state, official.district]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
    const matchesRank = rankFilter === 'all' || official.rank === rankFilter;
    return matchesQuery && matchesRank;
  });

  const sections = RANK_ORDER.map((rank) => ({
    title: RANK_LABELS[rank],
    data: filteredOfficials.filter((o) => o.rank === rank),
  })).filter((s) => s.data.length > 0);

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.rlpGreen} colors={[Colors.rlpGreen]} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Padadhikari</Text>
        <Pressable
          style={({ pressed }) => [styles.toggleBtn, hierarchyMode && styles.toggleBtnActive, pressed && { opacity: 0.75 }]}
          onPress={() => setHierarchyMode((v) => !v)}
          accessibilityRole="button"
        >
          <Text style={[styles.toggleText, hierarchyMode && styles.toggleTextActive]}>{hierarchyMode ? 'Flat' : 'Hierarchy'}</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, role, district"
          placeholderTextColor={Colors.onSurfaceVariant}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rankChips}>
          {['all', ...RANK_ORDER].map((rank) => (
            <Pressable
              key={rank}
              style={({ pressed }) => [styles.rankChip, rankFilter === rank && styles.rankChipActive, pressed && { opacity: 0.75 }]}
              onPress={() => setRankFilter(rank)}
              accessibilityRole="button"
            >
              <Text style={[styles.rankChipText, rankFilter === rank && styles.rankChipTextActive]}>
                {rank === 'all' ? 'All' : RANK_LABELS[rank]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {hierarchyMode ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <View style={styles.itemWrapper}><OfficialCard official={item} onPress={handleCardPress} /></View>}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{section.title}</Text></View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={<EmptyState />}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <FlatList
          data={filteredOfficials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <View style={styles.itemWrapper}><OfficialCard official={item} onPress={handleCardPress} /></View>}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={<EmptyState />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.white },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.onSurface },
  headerTitle: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.onSurface, marginLeft: 4 },
  toggleBtn: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  toggleBtnActive: { backgroundColor: Colors.rlpGreen, borderColor: Colors.rlpGreen },
  toggleText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  toggleTextActive: { color: Colors.white },
  filters: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  searchInput: { backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurface, marginBottom: 10 },
  rankChips: { gap: 8 },
  rankChip: { borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: Colors.white },
  rankChipActive: { backgroundColor: Colors.rlpGreen, borderColor: Colors.rlpGreen },
  rankChipText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.onSurfaceVariant },
  rankChipTextActive: { color: Colors.white },
  listContent: { padding: 16, paddingBottom: 28 },
  itemWrapper: { marginBottom: 10 },
  sectionHeader: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8, marginTop: 4 },
  sectionHeaderText: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.rlpGreen, letterSpacing: 0.5, textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurfaceVariant },
});
