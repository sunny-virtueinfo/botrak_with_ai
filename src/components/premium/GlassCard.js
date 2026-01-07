import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../theme';

const GlassCard = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
});

export default GlassCard;
