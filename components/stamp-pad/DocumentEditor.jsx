import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

const TEMPLATES = [
  { id: 'standard', label: 'Standard Official', icon: '📄' },
  { id: 'press', label: 'Press Release', icon: '📰' },
  { id: 'internal', label: 'Internal Memo', icon: '📋' },
];

const SUBJECT_MAX = 200;

export default function DocumentEditor({ subject, body, template, stampEnabled, onSubjectChange, onBodyChange, onTemplateChange, onStampToggle }) {
  const applyBold = () => onBodyChange(body + '**bold text**');
  const applyItalic = () => onBodyChange(body + '_italic text_');
  const applyBullet = () => onBodyChange(body + '\n• ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Subject</Text>
        <TextInput
          style={styles.subjectInput}
          value={subject}
          onChangeText={(t) => onSubjectChange(t.slice(0, SUBJECT_MAX))}
          placeholder="Enter subject..."
          placeholderTextColor={Colors.onSurfaceVariant}
          maxLength={SUBJECT_MAX}
          returnKeyType="next"
          accessibilityLabel="Subject"
        />
        <Text style={styles.charCounter}>{subject.length}/{SUBJECT_MAX}</Text>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]} onPress={applyBold} accessibilityRole="button" accessibilityLabel="Bold">
          <Text style={styles.toolbarBtnText}>B</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]} onPress={applyItalic} accessibilityRole="button" accessibilityLabel="Italic">
          <Text style={[styles.toolbarBtnText, styles.italic]}>I</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]} onPress={applyBullet} accessibilityRole="button" accessibilityLabel="Bullet list">
          <Text style={styles.toolbarBtnText}>•</Text>
        </Pressable>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Body</Text>
        <TextInput
          style={styles.bodyInput}
          value={body}
          onChangeText={onBodyChange}
          placeholder="Write your letter content here..."
          placeholderTextColor={Colors.onSurfaceVariant}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Letter body"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Template</Text>
        <View style={styles.templateList}>
          {TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [styles.templateCard, template === t.id && styles.templateCardActive, pressed && { opacity: 0.8 }]}
              onPress={() => onTemplateChange(t.id)}
              accessibilityRole="radio"
              accessibilityLabel={t.label}
            >
              <Text style={styles.templateIcon}>{t.icon}</Text>
              <Text style={[styles.templateLabel, template === t.id && styles.templateLabelActive]}>{t.label}</Text>
              {template === t.id && (
                <View style={styles.radioSelected}>
                  <View style={styles.radioDot} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.stampRow}>
        <View style={styles.stampInfo}>
          <Text style={styles.stampLabel}>Digital Stamp</Text>
          <Text style={styles.stampSubLabel}>Add official RLP stamp to document</Text>
        </View>
        <Switch
          value={stampEnabled}
          onValueChange={onStampToggle}
          trackColor={{ false: Colors.outlineVariant, true: Colors.rlpGreen }}
          thumbColor={stampEnabled ? Colors.white : Colors.surfaceContainerHighest}
          accessibilityLabel="Toggle digital stamp"
        />
      </View>

      {stampEnabled && (
        <View style={styles.stampPreviewContainer}>
          <View style={styles.stampCircle}>
            <Text style={styles.stampText}>RLP{'\n'}OFFICIAL</Text>
          </View>
          <Text style={styles.stampPreviewLabel}>Stamp preview</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  subjectInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface },
  charCounter: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.onSurfaceVariant, textAlign: 'right' },
  toolbar: { flexDirection: 'row', gap: 8, backgroundColor: Colors.surfaceContainerLow, borderRadius: 8, padding: 6, alignSelf: 'flex-start' },
  toolbarBtn: { width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.outlineVariant },
  toolbarBtnPressed: { backgroundColor: Colors.surfaceContainerHigh },
  toolbarBtnText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface },
  italic: { fontStyle: 'italic' },
  bodyInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface, minHeight: 200 },
  templateList: { gap: 8 },
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 14, gap: 12 },
  templateCardActive: { borderColor: Colors.rlpGreen, backgroundColor: Colors.secondaryContainer },
  templateIcon: { fontSize: 20 },
  templateLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14, color: Colors.onSurface },
  templateLabelActive: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
  radioSelected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.rlpGreen },
  stampRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.outlineVariant },
  stampInfo: { flex: 1, gap: 2 },
  stampLabel: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.onSurface },
  stampSubLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
  stampPreviewContainer: { alignItems: 'center', gap: 8 },
  stampCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.rlpGreen, alignItems: 'center', justifyContent: 'center' },
  stampText: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.rlpGreen, textAlign: 'center', letterSpacing: 0.5 },
  stampPreviewLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.onSurfaceVariant },
});
