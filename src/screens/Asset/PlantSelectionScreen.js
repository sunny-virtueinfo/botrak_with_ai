import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useApiService } from '../../services/ApiService';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import { useCustomModal } from '../../context/ModalContext';
import GlassCard from '../../components/premium/GlassCard';
import Feather from 'react-native-vector-icons/Feather';

const PlantSelectionScreen = ({ navigation, route }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const api = useApiService();
  const { showModal } = useCustomModal();

  const {
    organizationId,
    nextScreen = 'AssetList',
    ...otherParams
  } = route.params || {};

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const res = await api.getPlants(organizationId);
      if (res.data && res.data.success) {
        setPlants(res.data.plants || []);
      }
    } catch (e) {
      console.error('Fetch Plants Error', e);
      showModal('Error', 'Failed to load plants.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSelect = plant => {
    navigation.navigate(nextScreen, {
      plantId: plant.id,
      plantName: plant.name,
      organizationId,
      ...otherParams,
    });
  };

  const filteredPlants = plants.filter(plant =>
    plant.name?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handlePlantSelect(item)}
      style={styles.itemContainer}
    >
      <GlassCard style={styles.card}>
        <View style={styles.iconContainer}>
          <Feather name="map-pin" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.plantName}>{item.name}</Text>
          <Text style={styles.plantLocation}>{item.location || 'Plant'}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.textLight} />
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper title="Select Plant" showBack={true}>
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color={COLORS.textLight}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Plant..."
          placeholderTextColor={COLORS.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <Loader visible={true} size="large" overlay={false} />
        </View>
      ) : (
        <FlatList
          data={filteredPlants}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No plants found.</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: 12,
    height: 50,
    ...SHADOWS.soft,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  list: {
    padding: SPACING.m,
  },
  itemContainer: {
    marginBottom: SPACING.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  textContainer: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  plantLocation: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontStyle: FONTS.italic,
  },
});

export default PlantSelectionScreen;
