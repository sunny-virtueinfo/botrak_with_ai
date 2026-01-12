import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Feather from 'react-native-vector-icons/Feather';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const CONSTANT_USAGE = [
  { name: 'Medium', value: 'medium' },
  { name: 'Idle', value: 'idle' },
  { name: 'Low', value: 'low' },
  { name: 'High', value: 'high' },
];

const AssetListScreen = ({ route, navigation }) => {
  const { organizationId, orgName, isManualAudit } = route.params || {};
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter States
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'plant' or 'location'

  const { showToast } = useToast();
  const api = useApiService();

  // Determine Header Mode
  const isStackMode = !!(
    isManualAudit ||
    route.params?.redirectDetails ||
    route.params?.isForReminder ||
    route.params?.showBack
  );

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchPlantsAndCheckSelection();
  }, []);

  const fetchPlantsAndCheckSelection = async () => {
    try {
      if (!organizationId) return;
      const res = await api.getPlants(organizationId);
      if (res.data && res.data.success) {
        const plantList = res.data.plants || [];
        setPlants(plantList);

        // Priority 1: Route Params (passed from PlantSelectionScreen)
        if (route.params?.plantId) {
          const paramPlant = plantList.find(p => p.id === route.params.plantId);
          if (paramPlant) {
            handlePlantSelect(paramPlant, false); // false = don't toggle picker
            return;
          }
        }

        // Default: If no param, load assets normally (or wait for user to pick from internal dropdown)
        loadAssets('', null, null, 1);
      }
    } catch (e) {
      console.error('Fetch Plants Error', e);
      loadAssets('', null, null, 1);
    }
  };

  const handlePlantSelect = (plant, closePicker = true) => {
    setSelectedPlant(plant);
    setSearch('');
    // Reset to page 1
    loadAssets('', plant.id, null, 1);

    if (closePicker) setPickerVisible(false);
  };

  const loadAssets = async (
    searchText = '',
    plantId = selectedPlant?.id,
    locationId = selectedLocation?.id,
    pageNumber = 1,
  ) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let params = {
        organization_asset: {},
        q: searchText,
        from_mobile: true,
        page: pageNumber,
      };

      if (plantId) params.organization_asset.plant_id = plantId;

      let newData = [];

      if (isManualAudit) {
        if (route.params.auditId) {
          params.audit_id = route.params.auditId;
        }
        const response = await api.getManualAudit(organizationId, params);
        console.log('Manual Audit Response 1', response.data);
        if (response.data && response.data.success) {
          newData = response.data.data || response.data.organization_asset;
          if (!Array.isArray(newData)) newData = newData ? [newData] : [];
        }
      } else if (route.params?.redirectDetails) {
        const { label } = route.params.redirectDetails;

        if (label === 'Check-in') {
          params.organization_asset.checkin_checkout = 'Checkin';
        } else if (label === 'Check-out') {
          params.organization_asset.checkin_checkout = 'Checkout';
        }

        if (searchText) {
          params.q = JSON.stringify({ search_cont: searchText });
        } else {
          delete params.q;
        }

        const response = await api.getManualAudit(organizationId, params);
        console.log('Manual Audit Response 2', response.data);
        if (response.data && response.data.success) {
          newData = response.data.data || response.data.organization_asset;
          if (!Array.isArray(newData)) newData = newData ? [newData] : [];
        }
      } else {
        if (plantId) {
          console.log('organizationId', organizationId);
          console.log('params', params);
          const response = await api.getManualAudit(organizationId, params);
          console.log('Manual Audit Response 3', response.data);
          if (response.data && response.data.success) {
            newData = response.data.data || response.data.organization_asset;
            if (!Array.isArray(newData)) newData = newData ? [newData] : [];
          }
        } else {
          const searchParams = {
            search: searchText,
            from_mobile: true,
            page: pageNumber,
          };
          const response = await api.searchAssets(organizationId, searchParams);
          if (response.data && response.data.success) {
            newData =
              response.data.data || response.data.organization_asset || [];
          }
        }
      }

      if (pageNumber === 1) {
        setAssets(newData);
      } else {
        setAssets(prev => [...prev, ...newData]);
      }

      setHasMore(newData.length >= PAGE_SIZE);
      setPage(pageNumber);
    } catch (e) {
      console.error('Load Assets Error', e);
      showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = text => {
    setSearch(text);
    // Debounce can be added here, currently direct call
    loadAssets(text, selectedPlant?.id, selectedLocation?.id, 1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadAssets(search, selectedPlant?.id, selectedLocation?.id, page + 1);
    }
  };

  const handleItemPress = item => {
    if (route.params?.isForReminder) {
      navigation.navigate('AddReminder', {
        organizationId,
        assetCode: item.asset_code,
        assetId: item.id,
      });
    } else if (route.params?.redirectDetails) {
      const { redirectTo, label } = route.params.redirectDetails;
      const currentStatus = (item.checkin_checkout || '').toLowerCase();

      if (label === 'Check-in' && currentStatus !== 'checkin') {
        showToast('Asset is already checked in.', 'error');
        return;
      }
      if (label === 'Check-out' && currentStatus !== 'checkout') {
        showToast('Asset is already checked out.', 'error');
        return;
      }

      navigation.navigate(redirectTo, {
        plantId: item.current_plant_id || item.plant_id,
        label: label,
        assetCode: item.asset_code,
        assetName: item.asset_type,
        assetId: item.id,
        checkInOutStatus: item.checkin_checkout,
        assetLocationID: item.current_location_id || item.location_id,
        assetRegisterId: item.asset_register_id,
        subLocation: item.sub_location,
        ...route.params,
      });
    } else {
      navigation.navigate('UpdateAsset', {
        asset: item,
        organizationId,
        ...route.params,
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => handleItemPress(item)}>
      <View style={styles.card}>
        <View style={styles.statusIndicator(item.status)} />
        <View style={styles.cardContent}>
          <Text style={styles.assetName}>{item.name || item.asset_code}</Text>
          <Text style={styles.assetCode}>QR: {item.qr_code}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPickerModal = () => (
    <Modal
      visible={pickerVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select {pickerType === 'plant' ? 'Plant' : 'Location'}
          </Text>
          <FlatList
            data={pickerType === 'plant' ? plants : []}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handlePlantSelect(item)}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPickerVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScreenWrapper
      title={route.params?.title || orgName || 'Assets'}
      showMenu={!isStackMode}
      showBack={isStackMode}
      scrollable={false}
    >
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setPickerVisible(true);
            setPickerType('plant');
          }}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {selectedPlant ? selectedPlant.name : 'Select Plant'}
          </Text>
          <Feather name="chevron-down" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Assets..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <Loader visible={true} overlay={false} />
      ) : (
        <FlatList
          data={assets}
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
            <Text style={styles.emptyText}>No assets found.</Text>
          }
        />
      )}

      {renderPickerModal()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: 0,
    gap: 10,
  },
  dropdown: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  searchContainer: {
    padding: SPACING.m,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 10,
    fontSize: 16,
    color: COLORS.text,
    ...SHADOWS.soft,
  },
  list: { padding: SPACING.m },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.m,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  statusIndicator: status => ({
    width: 5,
    backgroundColor: status === 'available' ? COLORS.secondary : COLORS.error,
  }),
  cardContent: {
    padding: SPACING.m,
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  assetCode: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textLight,
  },
  badgeContainer: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, color: COLORS.textLight },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.l,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.m,
    textAlign: 'center',
    color: COLORS.text,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  closeButton: {
    marginTop: SPACING.m,
    alignSelf: 'center',
    padding: 10,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssetListScreen;
