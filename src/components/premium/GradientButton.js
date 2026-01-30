import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../theme';
import Loader from '../common/Loader';

const GradientButton = ({
  onPress,
  title,
  loading,
  style,
  colors = COLORS.gradients.primary,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={colors}
        style={styles.gradient}
      >
        {loading ? (
          <Loader
            visible={true}
            size="small"
            color={COLORS.surface}
            overlay={false}
          />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 54, // Taller button
    borderRadius: 16, // More rounded
    ...SHADOWS.medium,
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  text: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700', // Clearer bold
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

export default GradientButton;
