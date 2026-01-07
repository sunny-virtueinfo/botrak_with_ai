import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import LinearGradient from 'react-native-linear-gradient';

const AuditLocationSelectionModal = ({ visible, onClose, onManual, onQR, locationName }) => {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <View style={styles.handle} />
                        <Text style={styles.title}>Audit: {locationName}</Text>
                        <Text style={styles.subtitle}>Choose verification method</Text>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity style={[styles.optionCard, { marginRight: SPACING.s }]} onPress={onManual}>
                                <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={styles.gradient}>
                                    <Feather name="list" size={32} color={COLORS.primary} />
                                    <Text style={styles.optionText}>Manual Check</Text>
                                    <Text style={styles.optionSub}>Select from list</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.optionCard, { marginLeft: SPACING.s }]} onPress={onQR}>
                                <LinearGradient colors={['#f0fdf4', '#bbf7d0']} style={styles.gradient}>
                                    <Feather name="maximize" size={32} color={COLORS.success} />
                                    <Text style={[styles.optionText, { color: COLORS.success }]}>QR Scan</Text>
                                    <Text style={styles.optionSub}>Scan asset tag</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.l,
        minHeight: 300,
        ...SHADOWS.medium
    },
    handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.m },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', fontFamily: FONTS.bold },
    subtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: SPACING.xl },
    optionsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    optionCard: { flex: 1, height: 140, borderRadius: 16, overflow: 'hidden' },
    gradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.m },
    optionText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: SPACING.m },
    optionSub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 }
});

export default AuditLocationSelectionModal;
