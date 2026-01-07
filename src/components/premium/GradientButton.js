import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SHADOWS, SPACING } from '../../theme';
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
    height: 50, // Match standard input height
    borderRadius: 12,
  },
  gradient: {
    flex: 1, // Fill the container
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...SHADOWS.medium, // Move shadow here for better rendering
  },
  text: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold', // Slightly bolder
    letterSpacing: 0.5,
  },
});

export default GradientButton;
