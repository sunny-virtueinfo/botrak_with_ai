import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import GlassCard from '../premium/GlassCard';

const Loader = ({
  visible = false,
  message = 'Loading...',
  size = 'large',
  color = COLORS.primary,
  overlay = true,
}) => {
  if (!visible) return null;

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <GlassCard style={styles.loaderCard}>
            <ActivityIndicator size={size} color={color} />
            {message && <Text style={styles.message}>{message}</Text>}
          </GlassCard>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderCard: {
    padding: SPACING.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
  message: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineMessage: {
    marginTop: SPACING.s,
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default Loader;
