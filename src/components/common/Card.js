import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS, SPACING } from '../../theme';

const Card = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  gradientColors,
}) => {
  const isGradient = variant === 'gradient';

  const containerStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
    variant === 'glass' && styles.glass,
    style,
  ];

  const content = isGradient ? (
    <LinearGradient
      colors={gradientColors || COLORS.gradients.surface}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    children
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={isGradient ? null : containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {isGradient ? content : <View>{children}</View>}
      </TouchableOpacity>
    );
  }

  // For gradient view without onPress, we return just the gradient
  if (isGradient) {
    return content;
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.m,
  },
  gradient: {
    borderRadius: 16,
    padding: SPACING.m,
  },
  elevated: {
    ...SHADOWS.soft,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  flat: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    ...SHADOWS.soft,
  },
});

export default Card;
