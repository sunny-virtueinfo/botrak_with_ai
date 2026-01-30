import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import GlassCard from '../../components/premium/GlassCard';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const AssetAssignmentDetailScreen = ({ route, navigation }) => {
  const { scannedAsset, organizationId } = route.params;
  const api = useApiService();
  const { showToast } = useToast();

  const [asset, setAsset] = useState(scannedAsset);
  const [unassignModalVisible, setUnassignModalVisible] = useState(false);
  const [unassignReason, setUnassignReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isUnassigned =
    !asset.assigned_to && !asset.user_id && asset.status !== 'assigned';

  const handleAssign = () => {
    navigation.navigate('EmployeeList', {
      organizationId,
      asset: asset,
    });
  };

  const handleUnassignClick = () => {
    setUnassignReason('');
    setUnassignModalVisible(true);
  };

  const handleUnassignConfirm = async () => {
    try {
      setSubmitting(true);
      const payload = {
        asset_id: asset.id || asset.asset_id,
        reason: unassignReason,
      };
      const response = await api.unassignAsset(organizationId, payload);

      if (response.data && response.data.success) {
        showToast('Asset Unassigned Successfully', 'success');
        setUnassignModalVisible(false);
        navigation.navigate('Dashboard', {
          screen: 'AssetAssignment',
          params: { refresh: true },
        });
      } else {
        showToast(response.data?.message || 'Failed to unassign', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error unassigning asset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper
      title="Asset Details"
      showBack={true}
      scrollable={true}
      contentContainerStyle={styles.content}
    >
      <GlassCard style={styles.card}>
        <View style={styles.iconHeader}>
          <Icon
            name={isUnassigned ? 'package-variant' : 'account-check'}
            size={40}
            color={isUnassigned ? COLORS.success : COLORS.primary}
          />
        </View>

        <Text style={styles.assetName}>
          {asset.asset_description ||
            asset.name ||
            asset.asset_code ||
            'Unknown Asset'}
        </Text>
        <Text style={styles.assetCode}>{asset.asset_code}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{asset.asset_type || 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>
            {asset.location_name ||
              asset.location?.name ||
              asset.current_location_id ||
              'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Condition:</Text>
          <Text style={styles.value}>{asset.condition || 'N/A'}</Text>
        </View>

        {!isUnassigned && (
          <View style={styles.assignedContainer}>
            <Text style={styles.assignedLabel}>Currently Assigned To:</Text>
            <Text style={styles.assignedValue}>
              {asset.assigned_to?.name || asset.user_name || 'Assigned User'}
            </Text>

            {asset.checkincheckout?.checkout_purpose && (
              <>
                <Text style={[styles.assignedLabel, { marginTop: 10 }]}>
                  Purpose:
                </Text>
                <Text
                  style={[
                    styles.assignedValue,
                    { fontSize: 16, fontWeight: 'normal' },
                  ]}
                >
                  {asset.checkincheckout.checkout_purpose}
                </Text>
              </>
            )}
          </View>
        )}
      </GlassCard>

      <View style={styles.actions}>
        {isUnassigned ? (
          <GradientButton
            title="Assign Asset"
            icon="account-plus"
            onPress={handleAssign}
          />
        ) : (
          <TouchableOpacity
            style={styles.unassignBtn}
            onPress={handleUnassignClick}
          >
            <Icon
              name="link-variant-off"
              size={20}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.btnTextWhite}>Unassign Asset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unassign Reason Modal */}
      <Modal
        visible={unassignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnassignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reasonContent}>
            <Text style={styles.modalTitle}>Unassign Asset</Text>
            <Text style={styles.modalMessage}>Please provide a reason:</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason..."
              value={unassignReason}
              onChangeText={setUnassignReason}
              multiline
            />
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="neutral"
                  onPress={() => setUnassignModalVisible(false)}
                  style={{ width: '100%' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Confirm Unassign"
                  variant="danger"
                  onPress={handleUnassignConfirm}
                  loading={submitting}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.m },
  card: { padding: SPACING.l, alignItems: 'center' },
  iconHeader: {
    marginBottom: SPACING.m,
    padding: 15,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  assetName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  assetCode: { fontSize: 16, color: COLORS.textLight, marginBottom: SPACING.m },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: { fontSize: 16, color: COLORS.textLight },
  value: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  assignedContainer: {
    marginTop: SPACING.m,
    backgroundColor: COLORS.surface,
    width: '100%',
    padding: SPACING.m,
    borderRadius: 10,
    alignItems: 'center',
  },
  assignedLabel: { fontSize: 14, color: COLORS.textLight, marginBottom: 5 },
  assignedValue: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold' },
  actions: { marginTop: SPACING.xl },
  unassignBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  btnTextWhite: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Modal Styles (Reused)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  reasonContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  modalMessage: { fontSize: 14, color: COLORS.textLight, marginBottom: 10 },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  activeTabText: { color: COLORS.primary },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    alignSelf: 'center',
  },
});

export default AssetAssignmentDetailScreen;
