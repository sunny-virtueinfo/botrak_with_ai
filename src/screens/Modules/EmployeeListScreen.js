import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const EmployeeListScreen = ({ route, navigation }) => {
  const { organizationId, asset } = route.params;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const api = useApiService();
  const { showToast } = useToast();

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadEmployees('', 1);
  }, []);

  const loadEmployees = async (searchText = '', pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        q: searchText,
        page: pageNumber,
      };

      const response = await api.getEmployees(organizationId, params);

      if (response.data && (response.data.success || response.data.users)) {
        const users = response.data.users || response.data.data || [];

        if (pageNumber === 1) {
          setEmployees(users);
        } else {
          setEmployees(prev => [...prev, ...users]);
        }

        if (users.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setPage(pageNumber);
      } else {
        if (pageNumber === 1) setEmployees([]);
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading employees', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadEmployees(search, page + 1);
    }
  };

  const handleSearch = text => {
    setSearch(text);
    loadEmployees(text, 1);
  };

  const handleEmployeeSelect = employee => {
    setSelectedEmployee(employee);
    setConfirmModalVisible(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedEmployee || !asset) return;

    try {
      setAssigning(true);
      const payload = {
        organization_asset: {
          user_id: selectedEmployee.id,
          asset_id: asset.id,
        },
      };

      const response = await api.assignAsset(organizationId, payload);

      if (response.data && response.data.success) {
        showToast('Asset assigned successfully', 'success');
        setConfirmModalVisible(false);
        navigation.navigate('AssetAssignment', { refresh: true });
      } else {
        showToast(response.data?.message || 'Assignment failed', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Assignment failed', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleEmployeeSelect(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || 'Unknown User'}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>{item.role || 'Employee'}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper title="Select Employee" showBack={true}>
      <View style={styles.searchContainer}>
        <Icon
          name="magnify"
          size={20}
          color={COLORS.textLight}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Employees..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <Loader visible={true} size="large" overlay={false} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <Loader visible={true} size="small" overlay={false} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No employees found.</Text>
          }
        />
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Assignment</Text>
            <Text style={styles.modalMessage}>
              Assign asset "{asset.name || asset.asset_code}" to{' '}
              {selectedEmployee?.name}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={assigning}
              >
                <Text style={styles.btnTextCancel}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleConfirmAssign}
                disabled={assigning}
              >
                {assigning ? (
                  <Loader
                    visible={true}
                    size="small"
                    color="white"
                    overlay={false}
                  />
                ) : (
                  <Text style={styles.btnTextConfirm}>Yes</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: 10,
    ...SHADOWS.soft,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 50,
    color: COLORS.text,
  },
  list: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.s,
    ...SHADOWS.soft,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textLight },
  role: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.textLight },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  confirmBtn: { backgroundColor: COLORS.primary },
  btnTextCancel: { color: COLORS.text, fontWeight: 'bold' },
  btnTextConfirm: { color: 'white', fontWeight: 'bold' },
});

export default EmployeeListScreen;
