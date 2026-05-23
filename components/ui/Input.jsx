import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function Input({
  label, placeholder, value, onChangeText, error, icon,
  secureTextEntry = false, keyboardType = 'default', multiline = false,
  maxLength, autoCapitalize = 'sentences', rightElement, editable = true,
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? Colors.error : focused ? Colors.rlpGreen : Colors.outlineVariant;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, { borderColor }, !editable && styles.disabled]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          placeholder={placeholder}
          placeholderTextColor={Colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label ?? placeholder}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: 4 },
  label: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.onSurface, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 48,
  },
  disabled: { opacity: 0.6 },
  icon: { fontSize: 18, marginRight: 8, color: Colors.onSurfaceVariant },
  input: { flex: 1, fontFamily: FontFamily.regular, fontSize: 15, color: Colors.onSurface, paddingVertical: 12 },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
  rightElement: { marginLeft: 8 },
  errorText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 2 },
});
