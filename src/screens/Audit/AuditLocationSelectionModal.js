import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';

const AuditLocationSelectionModal = ({
  visible,
  onClose,
  onManual,
  onQR,
  locationName,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Audit: {locationName}</Text>
          <Text style={styles.subtitle}>Choose verification method</Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionCard, styles.manualCard]}
              onPress={onManual}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: COLORS.primary + '15' },
                ]}
              >
                <Feather name="list" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.optionText}>Manual Check</Text>
              <Text style={styles.optionSub}>Select from list</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, styles.qrCard]}
              onPress={onQR}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: COLORS.success + '15' },
                ]}
              >
                <Feather name="maximize" size={32} color={COLORS.success} />
              </View>
              <Text style={[styles.optionText, { color: COLORS.success }]}>
                QR Scan
              </Text>
              <Text style={styles.optionSub}>Scan asset tag</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.l,
    paddingBottom: SPACING.xl + 20,
    ...SHADOWS.hard,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontFamily: FONTS.medium,
  },
  optionsContainer: { flexDirection: 'row', gap: 16 },
  optionCard: {
    flex: 1,
    height: 160,
    borderRadius: 24,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  manualCard: { backgroundColor: COLORS.surface },
  qrCard: { backgroundColor: COLORS.surface },

  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  optionSub: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
});

export default AuditLocationSelectionModal;
