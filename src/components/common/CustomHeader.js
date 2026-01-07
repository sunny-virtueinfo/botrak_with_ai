import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';

const CustomHeader = ({
  title,
  showBack,
  showMenu,
  rightAction,
  transparent = false,
  gradientColors,
  textColor,
  iconColor,
}) => {
  const navigation = useNavigation();
  const activeGradient = gradientColors ||
    COLORS.gradients?.primary || ['#4F46E5', '#4338CA'];
  const isDefault = !gradientColors;

  const themeTextColor = textColor || (isDefault ? '#FFFFFF' : COLORS.text);
  const themeIconColor = iconColor || (isDefault ? '#FFFFFF' : COLORS.text);

  const handleBack = () => {
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
      <View style={[styles.container, styles.transparent]}>
        <HeaderContent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={activeGradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <HeaderContent />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    ...SHADOWS.soft,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
  },
  transparent: {
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: COLORS.text,
    letterSpacing: 0.5,
    fontFamily: FONTS?.bold,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
});

export default CustomHeader;
