import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import GlassCard from '../../components/premium/GlassCard';
import Feather from 'react-native-vector-icons/Feather';
import Loader from '../../components/common/Loader';

const ApprovalsScreen = ({ route, navigation }) => {
  const { organizationId } = route.params || {};
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const api = useApiService();
  const { showToast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      if (!organizationId) return;
      setLoading(true);
      const response = await api.getPendingRequests(organizationId);
      if (response.data && response.data.success) {
        setRequests(response.data.requests || []);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  // Open Modals
  const openApproveModal = id => {
    setSelectedId(id);
    setApproveModalVisible(true);
  };

  const openRejectModal = id => {
    setSelectedId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // API Actions
  const handleCancelApprove = () => {
    setApproveModalVisible(false);
  };

  const handleCancelReject = () => {
    setRejectModalVisible(false);
  };

  const handleApproveConfirm = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      await api.approveRequest(organizationId, selectedId);
      setApproveModalVisible(false);
      showToast('Request approved successfully', 'success');
      loadRequests();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      await api.rejectRequest(organizationId, selectedId, {
        reason: rejectReason,
      });
      setRejectModalVisible(false);
      showToast('Request rejected successfully', 'success');
      loadRequests();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.iconWrapper}>
        <Feather name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}>
          <Feather name="box" size={14} color="white" />
          <Text style={styles.idText}>{item.code}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Feather
            name="clock"
            size={12}
            color={COLORS.textLight}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.date}>
            {item.request_date
              ? new Date(item.request_date).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : ''}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <DetailRow icon="tag" label="Asset Type" value={item.type} />
      <DetailRow icon="user" label="Requested By" value={item.requested_by} />
      <DetailRow
        icon="map-pin"
        label="Transfer"
        value={`${item.current_location}  ➔  ${item.transfer_location}`}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => openRejectModal(item.id)}
        >
          <Feather
            name="x"
            size={18}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => openApproveModal(item.id)}
        >
          <Feather
            name="check"
            size={18}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <ScreenWrapper title="Approvals" showMenu={true} scrollable={false}>
      {loading && (
        <View style={styles.loaderContainer}>
          <Loader visible={true} size="small" overlay={false} />
        </View>
      )}
      <Loader
        visible={actionLoading}
        size="small"
        overlay={true}
        message="Processing..."
      />
      {!loading && (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending approvals.</Text>
          }
        />
      )}

      {/* Approve Modal */}
      <Modal
        visible={approveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelApprove}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Request</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to approve this request?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={handleCancelApprove}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleApproveConfirm}
              >
                <Text style={styles.modalBtnTextConfirm}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalMessage}>
              Please provides a reason for rejection:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={handleCancelReject}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.rejectBtn]}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalBtnTextConfirm}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m, paddingBottom: 100 },
  card: {
    marginBottom: SPACING.m,
    padding: 0,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'space-between',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.error || '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...SHADOWS.soft,
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.success || '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...SHADOWS.soft,
  },
  approveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.textLight,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  modalMessage: { fontSize: 16, color: COLORS.textLight, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalBtnCancel: { backgroundColor: '#f0f0f0' },
  modalBtnConfirm: { backgroundColor: COLORS.success || '#4CAF50' },
  modalBtnTextCancel: { fontWeight: 'bold', color: COLORS.text },
  modalBtnTextConfirm: { fontWeight: 'bold', color: 'white' },
  rejectBtn: { backgroundColor: COLORS.error },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
});

export default ApprovalsScreen;
