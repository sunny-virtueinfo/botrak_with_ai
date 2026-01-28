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
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Feather from 'react-native-vector-icons/Feather';
import ScreenWrapper from '../../components/common/ScreenWrapper';

import Loader from '../../components/common/Loader';
import NewPickerForPlant from '../../components/common/NewPickerForPlant';

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

        if (route.params?.plantId) {
          const paramPlant = plantList.find(p => p.id === route.params.plantId);
          if (paramPlant) {
            handlePlantSelect(paramPlant, false); // false = don't toggle picker
            return;
          }
        }

        loadAssets('', null, null, 1);
      }
    } catch (e) {
      console.error('Fetch Plants Error', e);
      loadAssets('', null, null, 1);
    }
  };

  const handlePlantSelect = plant => {
    setSelectedPlant(plant);
    setSearch('');
    loadAssets('', plant.id, null, 1);
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
        if (response.data && response.data.success) {
          newData = response.data.data || response.data.organization_asset;
          if (!Array.isArray(newData)) newData = newData ? [newData] : [];
        }
      } else if (route.params?.redirectDetails) {
        const { label } = route.params.redirectDetails;

        if (label === 'Check-in') {
          params.organization_asset.checkin_checkout = 'checkin';
        } else if (label === 'Check-out') {
          params.organization_asset.checkin_checkout = 'checkout';
        }

        if (searchText) {
          params.q = { search_cont: searchText };
        } else {
          delete params.q;
        }
        const response = await api.getManualAudit(organizationId, params);
        if (response.data && response.data.success) {
          newData = response.data.data || response.data.organization_asset;
          if (!Array.isArray(newData)) newData = newData ? [newData] : [];
        }
      } else {
        if (plantId) {
          const response = await api.getManualAudit(organizationId, params);
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

      if (label === 'Check-in' && currentStatus !== 'checkout') {
        showToast('Asset is already checked in.', 'error');
        return;
      }
      if (label === 'Check-out' && currentStatus !== 'checkin') {
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

  return (
    <ScreenWrapper
      title={route.params?.title || orgName || 'Assets'}
      showMenu={!isStackMode}
      showBack={isStackMode}
      scrollable={false}
    >
      <View style={styles.filterContainer}>
        <View style={{ flex: 1 }}>
          <NewPickerForPlant
            plants={plants}
            selected={selectedPlant}
            valueChange={handlePlantSelect}
            pickerStyle={styles.dropdownBtn}
          />
        </View>
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
  dropdownBtn: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
    fontStyle: FONTS.italic,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textLight,
    fontStyle: FONTS.italic,
  },
  badgeContainer: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gradients.background[0],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, color: COLORS.textLight },
});

export default AssetListScreen;
