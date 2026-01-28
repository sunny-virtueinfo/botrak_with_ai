import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import GradientButton from '../../components/premium/GradientButton';
import GlassCard from '../../components/premium/GlassCard';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useApiService } from '../../services/ApiService';
import { useCustomModal } from '../../context/ModalContext';

const AssetDetailScreen = ({ route, navigation }) => {
  const { asset, organizationId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState('checkin'); // 'checkin' or 'checkout'
  const [notes, setNotes] = useState('');
  const [assignee, setAssignee] = useState('');
  const api = useApiService();
  const { showModal } = useCustomModal();

  const EditButton = () => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('UpdateAsset', { asset, organizationId })
      }
    >
      <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Edit</Text>
    </TouchableOpacity>
  );

  const handleAction = type => {
    setActionType(type);
    setModalVisible(true);
  };

  const confirmAction = async () => {
    try {
      const data = {
        notes,
        assignee_name: assignee,
        assignee: assignee,
        checkin_checkout_status:
          actionType === 'checkin' ? 'checkin' : 'checkout',
      };

      if (!asset.asset_register_id) {
        showModal('Error', 'Missing Asset Register ID');
        return;
      }

      if (actionType === 'checkin') {
        await api.checkInAsset(
          organizationId,
          asset.asset_register_id,
          asset.id,
          data,
        );
      } else {
        await api.checkOutAsset(
          organizationId,
          asset.asset_register_id,
          asset.id,
          data,
        );
      }

      showModal(
        'Success',
        `Asset ${actionType === 'checkin' ? 'Checked In' : 'Checked Out'}`,
      );
      setModalVisible(false);
      navigation.goBack();
    } catch (e) {
      showModal('Error', 'Failed to update asset');
      console.error(e);
    }
  };

  return (
    <ScreenWrapper
      title="Asset Details"
      showBack={true}
      rightAction={<EditButton />}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Image Placeholder */}
        <View style={styles.imageContainer}>
          <Text style={styles.placeholderText}>{asset.name?.charAt(0)}</Text>
        </View>

        {/* Info Card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.headerRow}>
            <Text style={styles.assetName}>{asset.name}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    asset.status === 'available'
                      ? COLORS.secondary
                      : COLORS.primary,
                },
              ]}
            >
              <Text style={styles.badgeText}>
                {asset.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>QR Code</Text>
          <Text style={styles.value}>{asset.qr_code}</Text>

          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>
            {asset.location_id || 'Unknown'} (Plant {asset.plant_id || 'N/A'})
          </Text>

          <Text style={styles.label}>Synced At</Text>
          <Text style={styles.value}>
            {new Date(asset.synced_at).toLocaleString()}
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {(asset.checkin_checkout || '').toLowerCase() === 'checkout' ? (
          <GradientButton
            title="Check In"
            colors={COLORS.gradients.success}
            onPress={() => handleAction('checkin')}
          />
        ) : (
          <GradientButton
            title="Check Out"
            onPress={() => handleAction('checkout')}
          />
        )}
      </View>

      {/* Action Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'checkin' ? 'Check In Asset' : 'Check Out Asset'}
            </Text>

            {actionType === 'checkout' && (
              <TextInput
                style={styles.input}
                placeholder="Assign to (User ID/Name)"
                value={assignee}
                onChangeText={setAssignee}
              />
            )}

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes (Optional)"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalButtons}>
              <GradientButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
                colors={['#9CA3AF', '#6B7280']}
              />
              <GradientButton
                title="Confirm"
                onPress={confirmAction}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SPACING.m, paddingBottom: 100 },
  imageContainer: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: SPACING.m,
  },
  placeholderText: { fontSize: 80, color: COLORS.primary, fontWeight: 'bold' },
  infoCard: { marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  assetName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  label: { color: COLORS.textLight, fontSize: 12, marginTop: SPACING.m },
  value: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    color: COLORS.text,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, marginHorizontal: 5 },
});

export default AssetDetailScreen;
