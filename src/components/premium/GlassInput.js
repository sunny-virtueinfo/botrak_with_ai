import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS, FONTS, SPACING } from '../../theme';

const GlassInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  keyboardType,
  autoCapitalize,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textLight}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight + '80'} // Slight opacity
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // Cleaner look
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    height: 56, // Taller touch target
    ...SHADOWS.soft,
  },
  inputFocused: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
    height: '100%',
  },
});

export default GlassInput;
