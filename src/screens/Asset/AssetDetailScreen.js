import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
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
      style={styles.editBtn}
    >
      <Feather name="edit-2" size={20} color={COLORS.primary} />
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
          <Feather name="box" size={64} color={COLORS.primary} />
          <Text style={styles.placeholderText}>{asset.name}</Text>
        </View>

        {/* Info Card */}
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.headerRow}>
            <Text style={styles.assetName}>{asset.name}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    asset.status === 'available'
                      ? COLORS.success + '20'
                      : COLORS.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      asset.status === 'available'
                        ? COLORS.success
                        : COLORS.warning,
                  },
                ]}
              >
                {asset.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>QR Code</Text>
            <Text style={styles.value}>{asset.qr_code}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {asset.location_id || 'Unknown'}{' '}
              <Text style={styles.subValue}>
                (Plant {asset.plant_id || 'N/A'})
              </Text>
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Last Synced</Text>
            <Text style={styles.value}>
              {new Date(asset.synced_at).toLocaleString()}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {(asset.checkin_checkout || '').toLowerCase() === 'checkout' ? (
          <Button
            title="Check In Asset"
            variant="primary"
            onPress={() => handleAction('checkin')}
            style={styles.actionBtn}
            icon="log-in"
          />
        ) : (
          <Button
            title="Check Out Asset"
            variant="secondary"
            onPress={() => handleAction('checkout')}
            style={styles.actionBtn}
            icon="log-out"
          />
        )}
      </View>

      {/* Action Modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {actionType === 'checkin' ? 'Check In Asset' : 'Check Out Asset'}
            </Text>

            {actionType === 'checkout' && (
              <TextInput
                style={styles.input}
                placeholder="Assign to (User ID/Name)"
                placeholderTextColor={COLORS.textPlaceholder}
                value={assignee}
                onChangeText={setAssignee}
              />
            )}

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Add notes (Optional)"
              placeholderTextColor={COLORS.textPlaceholder}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Confirm"
                variant="primary"
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
  editBtn: {
    padding: 8,
  },
  imageContainer: {
    height: 180,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholderText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 12,
    fontFamily: FONTS.bold,
  },
  infoCard: {
    padding: SPACING.l,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.m,
  },
  assetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.bold,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontWeight: 'bold', fontSize: 12 },

  detailItem: { marginBottom: SPACING.m },
  label: {
    color: COLORS.textLight,
    fontSize: 13,
    marginBottom: 4,
    fontFamily: FONTS.medium,
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  subValue: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: 'normal',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: SPACING.xl,
    ...SHADOWS.top,
  },
  actionBtn: {
    width: '100%',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.l,
    paddingBottom: SPACING.xl + 20,
    ...SHADOWS.hard,
  },
  modalHandle: {
    width: 48,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.l,
    textAlign: 'center',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground,
    fontSize: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalBtn: { flex: 1 },
});

export default AssetDetailScreen;
