import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const CATEGORIES = ['All Templates', 'Tyohaar', 'Rally', 'Shubhkamnayen', 'Election 2024', 'Leadership'];

function TemplateCard({ template, isSubscribed, onPress }) {
  const locked = template.isPremium && !isSubscribed;
  return (
    <Pressable
      style={({ pressed }) => [styles.templateCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={template.name}
    >
      {template.imageUrl ? (
        <Image source={{ uri: template.imageUrl }} style={styles.templateImage} resizeMode="cover" />
      ) : (
        <View style={[styles.templateImage, styles.templateFallback, { backgroundColor: template.accent ?? Colors.rlpGreen }]}>
          <Text style={styles.templateFallbackKicker}>RLP DIGITAL</Text>
          <Text style={styles.templateFallbackTitle}>{template.name}</Text>
        </View>
      )}
      {locked && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>LOCK</Text>
            <Text style={styles.lockText}>PREMIUM</Text>
          </View>
        </View>
      )}
      {!template.isPremium && (
        <View style={[styles.badge, styles.newBadge]}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      )}
      {template.isPremium && (
        <View style={[styles.badge, styles.premiumBadge]}>
          <Text style={[styles.badgeText, { color: '#1a1a1a' }]}>PREMIUM</Text>
        </View>
      )}
      <View style={styles.templateNameContainer}>
        <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
      </View>
    </Pressable>
  );
}

export default function TemplateGrid({ templates, isSubscribed, onTemplatePress, selectedCategory, onCategoryChange, refreshControl }) {
  const filtered = selectedCategory === 'All Templates' || selectedCategory === 'All'
    ? templates
    : templates.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());

  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) rows.push(filtered.slice(i, i + 2));

  return (
    <View style={styles.container}>
      {/* Category chips matching Figma */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} style={styles.chipsContainer}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={({ pressed }) => [styles.chip, (selectedCategory === cat || (cat === 'All Templates' && selectedCategory === 'All')) && styles.chipActive, pressed && { opacity: 0.75 }]}
            onPress={() => onCategoryChange(cat === 'All Templates' ? 'All' : cat)}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, (selectedCategory === cat || (cat === 'All Templates' && selectedCategory === 'All')) && styles.chipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent} refreshControl={refreshControl}>
        {rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No templates in this category</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((template) => (
                <TemplateCard key={template.id} template={template} isSubscribed={isSubscribed} onPress={() => onTemplatePress(template)} />
              ))}
              {row.length === 1 && <View style={styles.emptySlot} />}
            </View>
          ))
        )}
        <View style={{ height: 130 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipsContainer: { flexGrow: 0 },
  chipsScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.rlpYellow, borderColor: Colors.rlpYellow },
  chipText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimaryContainer },
  gridContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  templateCard: { flex: 1, aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh, borderWidth: 1, borderColor: '#f0f0f0' },
  emptySlot: { flex: 1 },
  templateImage: { width: '100%', height: '100%' },
  templateFallback: { padding: 14, justifyContent: 'space-between' },
  templateFallbackKicker: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.rlpYellow, letterSpacing: 0.8 },
  templateFallbackTitle: { fontFamily: FontFamily.black, fontSize: 20, lineHeight: 24, color: Colors.white },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  lockBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockIcon: { fontFamily: FontFamily.bold, fontSize: 9, color: '#1a1a1a' },
  lockText: { fontFamily: FontFamily.bold, fontSize: 10, color: '#1a1a1a' },
  badge: { position: 'absolute', top: 8, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  newBadge: { left: 8, backgroundColor: Colors.rlpGreen },
  premiumBadge: { right: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: Colors.white, letterSpacing: 0.5 },
  templateNameContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 8 },
  templateName: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.white },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onSurfaceVariant },
});
