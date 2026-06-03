import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function SearchableOptionSelect({
  value,
  onSelect,
  options = [],
  placeholder = 'Search and choose',
  error = false,
  disabled = false,
  emptyText = 'No option found',
  open: controlledOpen,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const open = controlledOpen ?? internalOpen;

  function setOpen(nextValue) {
    if (controlledOpen === undefined) setInternalOpen(nextValue);
    onOpenChange?.(nextValue);
  }

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? options.filter((option) => option.toLowerCase().includes(normalizedQuery))
      : options;
  }, [options, query]);

  return (
    <View>
      <View style={[styles.control, error && styles.controlError, disabled && styles.controlDisabled]}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!disabled) setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={Colors.outline}
          autoCorrect={false}
        />
        <Pressable
          onPress={() => {
            if (disabled) return;
            const nextOpen = !open;
            if (!nextOpen) setQuery(value || '');
            setOpen(nextOpen);
          }}
          hitSlop={8}
        >
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {open ? (
        <View style={styles.menu}>
          <ScrollView nestedScrollEnabled style={styles.list} keyboardShouldPersistTaps="handled">
            {filteredOptions.length === 0 ? (
              <View style={styles.option}>
                <Text style={styles.optionText}>{emptyText}</Text>
              </View>
            ) : filteredOptions.map((option) => {
              const active = option === value;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onSelect(option);
                    setQuery(option);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
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

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  controlError: { borderColor: Colors.error },
  controlDisabled: { opacity: 0.9, backgroundColor: Colors.surfaceContainer },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurface,
    paddingVertical: 11,
  },
  menu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  list: { maxHeight: 180 },
  option: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  optionActive: { backgroundColor: Colors.primaryContainer },
  optionText: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.onSurface },
  optionTextActive: { fontFamily: FontFamily.semiBold, color: Colors.rlpGreen },
});
