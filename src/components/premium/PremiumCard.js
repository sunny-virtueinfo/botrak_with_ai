import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../theme';
import LinearGradient from 'react-native-linear-gradient';

const PremiumCard = ({ children, style, onPress }) => {
  const Container = onPress ? View : View;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: SPACING.m,
    ...SHADOWS.soft,
    backgroundColor: 'transparent',
  },
  gradient: {
    borderRadius: 16,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default PremiumCard;
