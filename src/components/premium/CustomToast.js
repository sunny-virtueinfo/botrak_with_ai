import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

const CustomToast = ({ message, type = 'info', visible, onHide }) => {
  const [show, setShow] = useState(visible);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        handleHide();
      }, 3000); // Auto hide after 3s
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleHide = () => {
    if (onHide) onHide();
    const timer = setTimeout(() => {
      setShow(false);
    }, 500);
  };

  if (!visible && !show) return null;

  const bgColors = {
    success: '#10B981', // Emerald 500
    error: '#EF4444', // Red 500
    info: '#3B82F6', // Blue 500
    warning: '#F59E0B', // Amber 500
  };

  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info',
    warning: 'alert-triangle',
  };

  return (
    <Animatable.View
      style={[
        styles.container,
        {
          backgroundColor: bgColors[type],
          top: insets.top + 10, // Dynamic top
        },
      ]}
      animation={visible ? 'slideInDown' : 'slideOutUp'}
      duration={500}
      useNativeDriver
    >
      <Icon name={icons[type]} size={24} color="white" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999, // On top of everything
    ...SHADOWS.medium,
  },
  icon: {
    marginRight: SPACING.s,
  },
  message: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
});

export default CustomToast;
