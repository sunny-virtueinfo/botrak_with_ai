import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import Card from '../../components/common/Card';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import { useCustomModal } from '../../context/ModalContext';

const { width } = Dimensions.get('window');

const getCategoryIcon = () => 'layers';

const AuditCategoriesScreen = ({ route, navigation }) => {
  const { auditId, locationId, plantId, locationName, organizationId } =
    route.params;
  const [categories, setCategories] = useState([]);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showModal } = useCustomModal();

  const api = useApiService();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.getCategoriesByLocation(
        organizationId,
        plantId,
        locationId,
      );
      const assetTypes = response.data.asset_type || response.data.data;

      if (assetTypes) {
        const formattedCategories = assetTypes.map((item, index) => {
          if (typeof item === 'string') {
            return { id: item, name: item };
          }
          return item;
        });
        setCategories(formattedCategories);
      }
    } catch (e) {
      console.error(e);
      showModal('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCategorySelect = category => {
    navigation.navigate('AuditAssetList', {
      auditId,
      locationId,
      categoryId: category.id,
      title: category.name,
      organizationId,
      plantId,
    });
  };

  const handleAllAssets = () => {
    navigation.navigate('AuditAssetList', {
      auditId,
      locationId,
      categoryId: null,
      title: 'All Assets',
      organizationId,
      plantId,
    });
    setShowFabOptions(false);
  };

  const handleAddNewAsset = () => {
    navigation.navigate('AddNewAsset', {
      auditId,
      locationId,
      organizationId,
      plantId,
    });
    setShowFabOptions(false);
  };

  const renderItem = ({ item }) => {
    const iconName = getCategoryIcon();

    return (
      <TouchableOpacity
        onPress={() => handleCategorySelect(item)}
        style={styles.gridItem}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name={iconName} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={COLORS.textLight} />
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper title={`Categories`} showBack={true}>
      <View style={styles.headerContainer}>
        <Text style={styles.locationLabel}>Location</Text>
        <Text style={styles.locationTitle}>
          {locationName || 'Unknown Location'}
        </Text>
        <Text style={styles.statsLabel}>
          {categories.length} Categories Found
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <Loader visible={true} size="large" overlay={false} />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item.id || index).toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="folder-minus" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No categories found.</Text>
            </View>
          }
        />
      )}

      {/* FAB Options Overlay (Enhanced) */}
      {showFabOptions && (
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowFabOptions(false)}
        >
          <View style={styles.fabOptionsContainer}>
            <TouchableOpacity
              style={styles.fabOptionItem}
              onPress={handleAddNewAsset}
              activeOpacity={0.8}
            >
              <Text style={styles.fabOptionLabel}>Add New Asset</Text>
              <LinearGradient
                colors={COLORS.gradients.success}
                style={styles.miniFab}
              >
                <Feather name="plus" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fabOptionItem}
              onPress={handleAllAssets}
              activeOpacity={0.8}
            >
              <Text style={styles.fabOptionLabel}>View All Assets</Text>
              <LinearGradient
                colors={COLORS.gradients.success}
                style={styles.miniFab}
              >
                <Feather name="list" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
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
            style={showFabOptions ? { transform: [{ rotate: '90deg' }] } : {}}
          />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.m,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: FONTS.medium,
  },
  locationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 4,
    fontFamily: FONTS.bold,
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },

  list: {
    paddingHorizontal: SPACING.m,
    paddingBottom: 100,
    gap: 10, // Space for FAB
  },
  gridItem: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHighlight, // Muted background
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingLeft: SPACING.m,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    fontStyle: 'italic',
    fontFamily: FONTS.regular,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.medium,
    zIndex: 100,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', // Dim background
    zIndex: 90,
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 100, // Above main FAB
    right: 32,
    alignItems: 'flex-end',
  },
  fabOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  fabOptionLabel: {
    marginRight: 15,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    ...SHADOWS.soft,
    fontFamily: FONTS.medium,
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
});

export default AuditCategoriesScreen;
