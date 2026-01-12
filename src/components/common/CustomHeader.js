import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomHeader = ({
  // ... props
  title,
  showBack,
  showMenu,
  rightAction,
  transparent = false,
  gradientColors,
  textColor,
  iconColor,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Default to Primary Gradient for Premium Look
  const activeGradient = gradientColors ||
    COLORS.gradients?.primary || ['#4F46E5', '#4338CA'];

  const isDefault = !gradientColors;

  // Default text/icon should be WHITE for the premium gradient
  const themeTextColor = textColor || (isDefault ? '#FFFFFF' : COLORS.text);
  const themeIconColor = iconColor || (isDefault ? '#FFFFFF' : COLORS.text);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  };

  const handleMenu = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const HeaderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.leftContainer}>
        {showMenu && (
          <TouchableOpacity
            onPress={handleMenu}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="menu" size={24} color={themeIconColor} />
          </TouchableOpacity>
        )}
        {showBack && !showMenu && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color={themeIconColor} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: themeTextColor }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );

  if (transparent) {
    return (
      <View
        style={[
          styles.container,
          styles.transparent,
          { paddingTop: insets.top, height: 60 + insets.top },
        ]}
      >
        <HeaderContent />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: 60 + insets.top }]}>
      <LinearGradient
        colors={activeGradient}
        style={[styles.gradient, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <HeaderContent />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 100,
    ...SHADOWS.medium, // Good elevation
    shadowColor: '#000', // Standard shadow color
    shadowOpacity: 0.15,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.m,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  transparent: {
    paddingHorizontal: SPACING.m,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: FONTS?.bold,
    // Removed uppercase and heavy text shadow for a cleaner "Corporate" look
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default CustomHeader;
