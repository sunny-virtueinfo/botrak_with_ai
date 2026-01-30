import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS, FONTS, SPACING } from '../../theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  rightIcon,
  onRightIconPress,
  keyboardType,
  autoCapitalize,
  error,
  multiline,
  numberOfLines,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && {
            minHeight: 120,
            alignItems: 'flex-start',
            paddingTop: 12,
          },
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={
              error
                ? COLORS.error
                : isFocused
                ? COLORS.primary
                : COLORS.textLight
            }
            style={[styles.icon, multiline && { marginTop: 4 }]}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && { textAlignVertical: 'top' },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {rightIcon && (
          <Feather
            name={rightIcon}
            size={20}
            color={COLORS.textLight}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMedium,
    fontFamily: FONTS.medium,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
    shadowColor: COLORS.borderDark, // Subtle shadow for depth
    shadowOpacity: 0.05,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...SHADOWS.glow,
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
    height: '100%',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
