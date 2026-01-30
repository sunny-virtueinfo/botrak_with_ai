import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS, SPACING, FONTS } from '../../theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'medium', // small, medium, large
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isGradient = variant === 'primary' || variant === 'secondary';

  const getGradientColors = () => {
    if (disabled) return [COLORS.border, COLORS.border];
    switch (variant) {
      case 'primary':
        return COLORS.gradients.primary;
      case 'secondary':
      case 'neutral':
        return COLORS.gradients.secondary;
      default:
        return COLORS.gradients.primary;
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return COLORS.border;
    switch (variant) {
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return COLORS.error;
      case 'neutral':
        return COLORS.border;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textLight;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#FFFFFF';
      case 'neutral':
        return COLORS.text;
      case 'outline':
        return COLORS.primary;
      case 'ghost':
        return COLORS.text;
      default:
        return COLORS.text;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 56;
      default:
        return 48;
    }
  };

  const containerStyle = [
    styles.container,
    { height: getHeight() },
    !isGradient && { backgroundColor: getBackgroundColor() },
    variant === 'outline' && { borderWidth: 1.5, borderColor: COLORS.primary },
    disabled && { opacity: 0.7 },
    style,
  ];

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={size === 'small' ? 16 : 20}
              color={getTextColor()}
              style={{ marginRight: title ? 8 : 0 }}
            />
          )}
          {title && (
            <Text
              style={[
                styles.text,
                { color: getTextColor(), fontSize: size === 'small' ? 14 : 16 },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </>
      )}
    </View>
  );

  const Touchable = (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        containerStyle,
        isGradient && { backgroundColor: 'transparent', padding: 0 }, // Reset for gradient
        !isGradient && styles.shadow, // Add shadow for solid buttons
        (variant === 'ghost' || variant === 'outline') && {
          elevation: 0,
          shadowOpacity: 0,
        }, // Remove shadow for flat
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height: getHeight() }]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );

  return Touchable;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  shadow: {
    ...SHADOWS.soft,
  },
});

export default Button;
