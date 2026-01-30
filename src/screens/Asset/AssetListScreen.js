import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SPACING, SHADOWS, FONTS, COLORS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Feather from 'react-native-vector-icons/Feather';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import NewPickerForPlant from '../../components/common/NewPickerForPlant';

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
            handlePlantSelect(paramPlant);
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

  const renderItem = ({ item }) => {
    const isAvailable = item.status?.toLowerCase() === 'assigned';
    const statusText = isAvailable ? 'Assigned' : 'Available';
    const statusColor = isAvailable ? COLORS.success : COLORS.warning;
    return (
      <Card
        onPress={() => handleItemPress(item)}
        style={styles.card}
        variant="elevated"
      >
        {/* <View style={[styles.statusStrip, { backgroundColor: statusColor }]} /> */}
        <View style={styles.cardContent}>
          <View style={{}}>
            <Text style={styles.assetName} numberOfLines={1}>
              {item.asset_code}
            </Text>
            <View style={styles.row}>
              <Feather
                name="box"
                size={14}
                color={COLORS.textLight}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.assetCode}>QR: {item.qr_code}</Text>
            </View>
          </View>

          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: statusColor + '15' },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper
      title={route.params?.title || orgName || 'Assets'}
      showMenu={!isStackMode}
      showBack={isStackMode}
      scrollable={false}
    >
      <View style={styles.headerContainer}>
        <View style={styles.filterSection}>
          <NewPickerForPlant
            plants={plants}
            selected={selectedPlant}
            valueChange={handlePlantSelect}
            pickerStyle={styles.dropdownBtn}
          />
        </View>

        <Input
          placeholder="Search by name or QR code..."
          value={search}
          onChangeText={handleSearch}
          icon="search"
          style={{ marginBottom: SPACING.s }}
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
            <View style={styles.emptyContainer}>
              <Feather name="box" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>
                No assets found matching criteria.
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: SPACING.m,
    paddingBottom: 0,
    backgroundColor: COLORS.background,
  },
  filterSection: {
    marginBottom: SPACING.s,
  },
  dropdownBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    ...SHADOWS.soft,
  },
  list: {
    padding: SPACING.m,
    paddingTop: SPACING.s,
  },
  card: {
    // padding: 0,
    // flexDirection: 'row',
    marginBottom: SPACING.s,
    // overflow: 'hidden',
    // backgroundColor: COLORS.primaryDark,
  },
  statusStrip: {
    // flex: 1,
    width: 6,
    height: '20%',
  },
  cardContent: {
    flex: 1,
    // padding: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: COLORS.primary,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetCode: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
});

export default AssetListScreen;
