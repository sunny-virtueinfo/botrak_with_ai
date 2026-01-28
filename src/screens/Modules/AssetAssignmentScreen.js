import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import { useCustomModal } from '../../context/ModalContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const AssetAssignmentScreen = ({ navigation, route }) => {
  const api = useApiService();
  const { showToast } = useToast();
  const { showModal } = useCustomModal();
  const { organizationId, registerId: paramRegisterId } = route.params || {};

  const [registerId, setRegisterId] = useState(paramRegisterId || null);

  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  // Data
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [unassignedAssets, setUnassignedAssets] = useState([]);

  // Unassign Modal
  const [unassignModalVisible, setUnassignModalVisible] = useState(false);
  const [selectedAssetForUnassign, setSelectedAssetForUnassign] =
    useState(null);
  const [unassignReason, setUnassignReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIndex(0);
      const scanned = route.params?.scannedAsset;
      if (scanned) {
        handleScannedAsset(scanned);
        navigation.setParams({ scannedAsset: null });
      } else {
        loadData();
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const loadData = async () => {
    setLoading(true);
    // 1. Ensure we have a register ID
    let currentRegisterId = paramRegisterId || registerId;

    // Sync state if param exists and differs
    if (paramRegisterId && paramRegisterId !== registerId) {
      setRegisterId(paramRegisterId);
    }

    if (!currentRegisterId) {
      try {
        if (!organizationId) return;
        // Fetch registers
        const res = await api.getAssetRegisters(organizationId);
        if (res.data) {
          const regs =
            res.data.asset_registers ||
            res.data.data ||
            (Array.isArray(res.data) ? res.data : []);
          if (regs && regs.length > 0) {
            currentRegisterId = regs[0].id;
            setRegisterId(currentRegisterId);
          }
        }
      } catch (e) {
        console.error('Failed to load registers', e);
      }
    }
    if (currentRegisterId) {
      await Promise.all([
        loadAssets(currentRegisterId, 'assigned'),
        loadAssets(currentRegisterId, 'unassigned'),
      ]);
    }
    setLoading(false);
  };

  const loadAssets = async (regId, type) => {
    try {
      const params = {
        page: 1,
        type: type,
      };
      const response = await api.getAssetListForAssignment(
        organizationId,
        regId,
        params,
      );
      if (response.data && response.data.success) {
        const list =
          response.data.organization_assets || response.data.data || [];
        if (type === 'assigned') {
          setAssignedAssets(list);
        } else {
          setUnassignedAssets(list);
        }
      }
    } catch (e) {
      console.error(`Error loading ${type} assets`, e);
    }
  };

  const handleScannedAsset = asset => {
    const isUnassigned =
      !asset.assigned_to && !asset.user_id && asset.status !== 'assigned';

    if (isUnassigned) {
      showModal(
        'Asset Scanned',
        `Found Unassigned Asset: ${
          asset.asset_description || asset.asset_code || asset.name
        }. Assign to employee?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign', onPress: () => handleAssignClick(asset) },
        ],
      );
    } else {
      const assignedName =
        asset.assigned_to?.name || asset.user_name || 'someone';
      showModal(
        'Asset Scanned',
        `Asset: ${
          asset.asset_description || asset.asset_code
        } is assigned to ${assignedName}. Unassign?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unassign', onPress: () => handleUnassignClick(asset) },
        ],
      );
    }
  };

  // --- Assigned Actions ---
  const handleUnassignClick = asset => {
    setSelectedAssetForUnassign(asset);
    setUnassignReason('');
    setUnassignModalVisible(true);
  };

  const handleUnassignConfirm = async () => {
    if (!selectedAssetForUnassign) return;
    try {
      setSubmitting(true);
      const payload = {
        asset_id:
          selectedAssetForUnassign.id || selectedAssetForUnassign.asset_id,
        reason: unassignReason,
      };
      const response = await api.unassignAsset(organizationId, payload);
      if (response.data && response.data.success) {
        showToast('Asset Unassigned', 'success');
        setUnassignModalVisible(false);
        loadData();
      } else {
        showToast(response.data?.message || 'Failed to unassign', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error unassigning', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Unassigned Actions ---
  const handleAssignClick = asset => {
    navigation.navigate('EmployeeList', {
      organizationId,
      asset: asset,
    });
  };

  // --- Render Items ---

  const renderAssignedItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.assetName}>{item.asset_code || 'No Code'}</Text>
          <Text style={styles.assetType}>
            {item.asset_type || 'Unknown Type'}
          </Text>
        </View>
        <Text style={styles.statusBadge}>Assigned</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Icon
          name="barcode"
          size={16}
          color={COLORS.textLight}
          style={styles.icon}
        />
        <Text style={styles.details}>QR: {item.qr_code || 'N/A'}</Text>
      </View>

      <View style={styles.row}>
        <Icon
          name="account"
          size={16}
          color={COLORS.textLight}
          style={styles.icon}
        />
        <Text style={styles.details}>
          Assigned To:{' '}
          <Text style={styles.highlight}>
            {item.assigned_to?.name || 'Unknown'}
          </Text>
        </Text>
      </View>

      {item.assigned_by && (
        <View style={styles.row}>
          <Icon
            name="account-check"
            size={16}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <Text style={styles.details}>By: {item.assigned_by?.name}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.unassignBtn}
          onPress={() => handleUnassignClick(item)}
        >
          <Icon
            name="link-variant-off"
            size={16}
            color="white"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.btnTextWhite}>Unassign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUnassignedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleAssignClick(item)}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.assetName}>{item.asset_code || 'No Code'}</Text>
          <Text style={styles.assetType}>
            {item.asset_type || 'Unknown Type'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
            Available
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Icon
          name="barcode"
          size={16}
          color={COLORS.textLight}
          style={styles.icon}
        />
        <Text style={styles.details}>QR: {item.qr_code || 'N/A'}</Text>
      </View>

      <View style={styles.row}>
        <Icon
          name="alert-circle-outline"
          size={16}
          color={COLORS.textLight}
          style={styles.icon}
        />
        <Text style={styles.details}>Condition: {item.condition || 'N/A'}</Text>
      </View>

      <View style={styles.clickHint}>
        <Text style={{ color: COLORS.primary, fontSize: 12 }}>
          Tap to Assign
        </Text>
        <Icon name="chevron-right" size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      title="Assignment"
      showBack={true}
      scrollable={false}
      onBackPress={() =>
        navigation.navigate('AssetRegisterSelection', { organizationId })
      }
    >
      {loading ? (
        <Loader visible={true} size="large" />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Custom Tabs */}
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, index === 0 && styles.activeTabBtn]}
              onPress={() => setIndex(0)}
            >
              <Text
                style={[styles.tabText, index === 0 && styles.activeTabText]}
              >
                Assigned
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, index === 1 && styles.activeTabBtn]}
              onPress={() => setIndex(1)}
            >
              <Text
                style={[styles.tabText, index === 1 && styles.activeTabText]}
              >
                Unassigned
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <FlatList
              data={index === 0 ? assignedAssets : unassignedAssets}
              renderItem={
                index === 0 ? renderAssignedItem : renderUnassignedItem
              }
              keyExtractor={item =>
                String(item.id || item.asset_id || Math.random())
              }
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {index === 0
                    ? 'No assigned assets found.'
                    : 'No unassigned assets found.'}
                </Text>
              }
              refreshing={loading}
              onRefresh={loadData}
            />
          </View>
        </View>
      )}
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
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setUnassignModalVisible(false)}
              >
                <Text style={styles.btnTextBlack}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleUnassignConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader
                    visible={true}
                    size="small"
                    color="white"
                    overlay={false}
                  />
                ) : (
                  <Text style={styles.btnTextWhite}>Unassign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  assetName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  statusBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: COLORS.primary,
    fontSize: 10,
    overflow: 'hidden',
  },
  assetType: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    fontStyle: FONTS.italic,
  },
  details: { fontSize: 14, color: COLORS.text, flex: 1 },
  icon: { marginRight: 8 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  highlight: { fontWeight: 'bold', color: COLORS.primary },
  clickHint: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: COLORS.textLight,
    fontStyle: FONTS.italic,
  },

  actionRow: { marginTop: 10, alignItems: 'flex-end' },
  unassignBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },

  // Modals
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  cancelBtn: { backgroundColor: COLORS.gradients.background[0] },
  confirmBtn: { backgroundColor: COLORS.error }, // Red for unassign
  btnTextWhite: { color: 'white', fontWeight: 'bold' },
  btnTextBlack: { color: COLORS.text, fontWeight: 'bold' },

  // Custom Tabs
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 16, color: COLORS.textLight, fontWeight: 'bold' },
  activeTabText: { color: COLORS.primary },
});

export default AssetAssignmentScreen;
