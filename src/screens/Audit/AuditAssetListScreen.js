import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import GenericDropdown from '../../components/common/GenericDropdown';
import { useToast } from '../../context/ToastContext';

const AuditAssetListScreen = ({ route, navigation }) => {
  const { auditId, locationId, categoryId, title, organizationId, plantId } =
    route.params;
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [isLoadMore, setIsLoadMore] = useState(false);
  const { showToast } = useToast();
  const api = useApiService();

  const [condition, setCondition] = useState('working');
  const [usage, setUsage] = useState('medium');
  const [remark, setRemark] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    loadLocations();
    loadLocations();
    loadAssets(1, '', true);
  }, [categoryId, selectedLocation]);

  const loadLocations = async () => {
    try {
      const response = await api.getLocations(organizationId, plantId);
      if (response.data && response.data.locations) {
        const formattedLocations = [
          { label: 'All', value: 'all' },
          ...response.data.locations.map(loc => ({
            label: loc.name,
            value: loc.id,
          })),
        ];
        setLocations(formattedLocations);
      }
    } catch (error) {
      console.error('Failed to load locations', error);
    }
  };
  useEffect(() => {
    if (route.params?.scannedAsset) {
      const scanned = route.params.scannedAsset;
      handleAssetSelect(scanned);
      // Clear param to prevent loop
      navigation.setParams({ scannedAsset: null });
    }
  }, [route.params?.scannedAsset]);

  const loadAssets = async (pageNum = 1, search = '', reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsLoadMore(true);

      const filterParams = {
        plant_id: plantId,
      };
      if (categoryId) {
        filterParams.asset_type = categoryId;
      }
      if (selectedLocation && selectedLocation !== 'all') {
        filterParams.location_id = selectedLocation;
      }

      const params = {
        organization_asset: JSON.stringify(filterParams),
        audit_id: auditId,
        page: pageNum,
        from_mobile: true,
      };

      if (search) {
        params.q = JSON.stringify({ search_cont: search });
      }
      const response = await api.filterAssetsByType(organizationId, params);
      let newAssets = [];
      const responseData = response.data;

      if (Array.isArray(responseData)) {
        newAssets = responseData;
      } else if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.organization_asset)) {
          newAssets = responseData.organization_asset;
        } else if (Array.isArray(responseData.data)) {
          newAssets = responseData.data;
        } else if (responseData.id) {
          newAssets = [responseData];
        } else if (responseData.success === true && responseData.data) {
          newAssets = Array.isArray(responseData.data)
            ? responseData.data
            : [responseData.data];
        }
      }

      if (newAssets.length > 0 || responseData.success) {
        if (reset) {
          setAssets(newAssets);
        } else {
          setAssets(prev => {
            const combined = [...prev, ...newAssets];
            const unique = Array.from(
              new Map(combined.map(item => [item.id, item])).values(),
            );
            return unique;
          });
        }

        if (newAssets.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        if (reset) setAssets([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsLoadMore(false);
    }
  };

  const handleSearch = text => {
    setSearchValue(text);
    setPage(1);
    setHasMore(true);
    setTimeout(() => {
      loadAssets(1, text, true);
    }, 500);
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadAssets(1, searchValue, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadAssets(nextPage, searchValue, false);
  };

  const handleAssetSelect = asset => {
    setSelectedAsset(asset);
    setCondition(asset.condition || 'working');
    setUsage(asset.usage || 'medium');
    setUsage(asset.usage || 'medium');
    setRemark(asset.remarks || '');
    setSelectedLocation(null); // Reset location selection
    setModalVisible(true);
  };

  const handleSubmitAudit = async () => {
    try {
      const assetsData = [
        {
          id: selectedAsset.id,
          condition: condition,
          usage: usage,
          remark: remark,
          asset_type: selectedAsset.asset_type,
          location_id: selectedLocation || locationId,
        },
      ];

      const payload = {
        audit_id: auditId,
        location_id: locationId,
        organization_asset: assetsData,
      };

      const response = await api.submitAuditEntry(organizationId, payload);
      if (response.data.success) {
        setModalVisible(false);
        showToast('Audit submitted successfully', 'success');
        loadAssets();
      } else {
        showToast(response.data.error, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to submit audit entry', 'error');
    }
  };

  const handleAddNewAsset = () => {
    navigation.navigate('AddNewAsset', {
      auditId,
      locationId,
      organizationId,
      plantId,
    });
  };

  const handleAllAssets = () => {
    navigation.push('AuditAssetList', {
      auditId,
      locationId,
      categoryId: null,
      title: 'All Assets',
      organizationId,
      plantId,
    });
  };

  const renderItem = ({ item }) => (
    <Card
      onPress={() => handleAssetSelect(item)}
      variant="elevated"
      style={styles.card}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor:
                item.checked === true
                  ? COLORS.checked.true
                  : COLORS.checked.false,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.asset_code || item.name}</Text>
          <Text style={styles.desc}>{item.asset_type || 'Unknown Type'}</Text>
        </View>
        <Feather
          name="check-circle"
          size={24}
          color={
            item.checked === true ? COLORS.checked.true : COLORS.checked.false
          }
        />
      </View>
    </Card>
  );

  return (
    <ScreenWrapper title={title} showBack={true}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search assets..."
          value={searchValue}
          onChangeText={handleSearch}
          icon="search"
          rightIcon={searchValue.length > 0 ? 'x' : undefined}
          onRightIconPress={() => handleSearch('')}
          returnKeyType="search"
          style={{ marginBottom: 0 }}
        />
      </View>

      <GenericDropdown
        label="Location"
        data={locations}
        value={selectedLocation}
        onValueChange={setSelectedLocation}
        placeholder="Select Location"
        style={{
          marginHorizontal: SPACING.m,
          marginTop: SPACING.s,
          paddingHorizontal: SPACING.m,
          paddingVertical: SPACING.m,
        }}
      />
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Loader visible={true} size="large" overlay={false} />
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadMore ? (
              <View style={{ padding: 20 }}>
                <Loader visible={true} size="small" overlay={false} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={styles.empty}>No assets found here.</Text>
            </View>
          }
        />
      )}

      {/* FAB Options Overlay */}
      {showFabOptions && (
        <View style={styles.fabOptionsContainer}>
          <TouchableOpacity
            style={styles.fabOption}
            onPress={handleAddNewAsset}
          >
            <Text style={styles.fabOptionText}>Add New Asset</Text>
            <View style={styles.miniFab}>
              <Feather name="plus" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabOption} onPress={handleAllAssets}>
            <Text style={styles.fabOptionText}>All Assets</Text>
            <View style={styles.miniFab}>
              <Feather name="list" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowFabOptions(!showFabOptions)}
      >
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.fabGradient}
        >
          <Feather
            name={showFabOptions ? 'x' : 'plus'}
            size={28}
            color="white"
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Audit Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Verify Asset</Text>
            <Text style={styles.assetName}>
              {selectedAsset?.organizationasset?.asset_code ||
                selectedAsset?.asset_code}
            </Text>

            <Text style={styles.label}>Condition</Text>
            <View style={styles.chipContainer}>
              {[
                { name: 'Working', value: 'working' },
                { name: 'Not working', value: 'not_working' },
                { name: 'Partially working', value: 'partially_working' },
                { name: 'Scrap', value: 'scrap' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setCondition(opt.value)}
                  style={[
                    styles.chip,
                    condition === opt.value && styles.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      condition === opt.value && styles.activeChipText,
                    ]}
                  >
                    {opt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Usage Status</Text>
            <View style={styles.chipContainer}>
              {[
                { name: 'Medium', value: 'medium' },
                { name: 'Idle', value: 'idle' },
                { name: 'Low', value: 'low' },
                { name: 'High', value: 'high' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setUsage(opt.value)}
                  style={[
                    styles.chip,
                    usage === opt.value && styles.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      usage === opt.value && styles.activeChipText,
                    ]}
                  >
                    {opt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Remarks</Text>
            <Input
              placeholder="Add notes..."
              value={remark}
              onChangeText={setRemark}
              area
              style={styles.inputArea}
            />

            <Button
              title="Submit Verification"
              variant="primary"
              onPress={handleSubmitAudit}
              style={{ marginTop: SPACING.l }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setModalVisible(false)}
              style={{ marginTop: SPACING.s }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m, paddingBottom: 100 },
  card: { marginBottom: SPACING.m, padding: SPACING.m, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: SPACING.m,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.textLight,
    fontStyle: FONTS.italic,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.l,
    paddingBottom: SPACING.xl + 20,
    ...SHADOWS.hard,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  assetName: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: SPACING.l,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  activeChipText: { color: 'white', fontWeight: 'bold' },

  inputArea: {
    height: 80,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...SHADOWS.medium,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 120,
    right: 30,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabOptionText: {
    marginRight: 12,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    ...SHADOWS.soft,
    fontFamily: FONTS.medium,
  },
  miniFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  searchContainer: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    marginBottom: SPACING.s,
  },
});

export default AuditAssetListScreen;
