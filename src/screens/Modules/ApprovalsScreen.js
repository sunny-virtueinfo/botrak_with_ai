import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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
      setLoading(false);
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
      showToast('Action failed', 'error');
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
      showToast('Action failed', 'error');
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
    <Card variant="elevated" style={styles.card}>
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
        <View style={{ flex: 1 }}>
          <Button
            title="Reject"
            variant="danger"
            icon="x"
            onPress={() => openRejectModal(item.id)}
            style={{ width: '100%' }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Approve"
            variant="primary"
            icon="check"
            onPress={() => openApproveModal(item.id)}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </Card>
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
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No pending approvals.</Text>
            </View>
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
        <Pressable style={styles.modalOverlay} onPress={handleCancelApprove}>
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Approve Request</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to approve this request?
            </Text>
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="neutral"
                  onPress={handleCancelApprove}
                  style={{ width: '100%' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Accept"
                  variant="primary"
                  onPress={handleApproveConfirm}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelReject}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelReject}>
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalMessage}>
              Please provide a reason for rejection:
            </Text>
            <Input
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason..."
              style={styles.input}
              multiline
            />
            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="neutral"
                  onPress={handleCancelReject}
                  style={{ width: '100%' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Confirm"
                  variant="danger"
                  onPress={handleRejectConfirm}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m, paddingBottom: 100 },
  card: {
    marginBottom: SPACING.m,
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
    fontFamily: FONTS.bold,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    backgroundColor: COLORS.surfaceHighlight,
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
    fontFamily: FONTS.semiBold,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    lineHeight: 20,
    fontFamily: FONTS.bold,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-between',
    gap: 12,
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 16,
    fontStyle: 'italic',
    fontFamily: FONTS.regular,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.hard,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  input: {
    height: 100,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', marginTop: 20, gap: 12 },

  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    alignSelf: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
});

export default ApprovalsScreen;
