import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../theme';
import GlassCard from '../premium/GlassCard';
import LinearGradient from 'react-native-linear-gradient';

const CustomModal = ({ visible, title, message, options = [], onClose }) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <GlassCard style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {options.map((option, index) => {
              const isDestructive = option.style === 'destructive';
              const isCancel = option.style === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel && styles.cancelButton,
                    isDestructive && styles.destructiveButton,
                    options.length === 2 && { flex: 1 }, // Force equal width for 2 buttons
                    options.length > 2 && styles.fullWidthButton, // Stack if many options
                  ]}
                  onPress={() => {
                    if (option.onPress) option.onPress();
                    onClose();
                  }}
                >
                  <LinearGradient
                    colors={
                      isDestructive
                        ? [COLORS.error, '#D32F2F']
                        : isCancel
                        ? ['#f5f5f5', '#e0e0e0']
                        : COLORS.gradients.primary
                    }
                    style={styles.gradient}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && { color: COLORS.textLight },
                        isDestructive && { color: 'white' },
                        !isCancel && !isDestructive && { color: 'white' },
                      ]}
                    >
                      {option.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
            {/* Default close if no options provided */}
            {options.length === 0 && (
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  style={styles.gradient}
                >
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    OK
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: SPACING.m,
  },
  button: {
    minWidth: 100,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  fullWidthButton: {
    width: '100%',
    marginBottom: SPACING.s,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});

export default CustomModal;
