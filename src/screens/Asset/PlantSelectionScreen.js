import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApiService } from '../../services/ApiService';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import GlassCard from '../../components/premium/GlassCard';
import Feather from 'react-native-vector-icons/Feather';

const PlantSelectionScreen = ({ navigation, route }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApiService();

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
      // Need active Organization ID. Preferably passed in params, else fallback.
      // If organizationId is missing, we might need to get it from Auth or Storage.
      // Assuming it's passed for now as it usually is in this app's flow.
      const res = await api.getPlants(organizationId);
      if (res.data && res.data.success) {
        setPlants(res.data.plants || []);
      }
    } catch (e) {
      console.error('Fetch Plants Error', e);
      Alert.alert('Error', 'Failed to load plants.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSelect = plant => {
    // Navigate to the next screen (AssetList) with params
    navigation.navigate(nextScreen, {
      plantId: plant.id,
      plantName: plant.name,
      organizationId,
      ...otherParams,
    });
  };

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
      {loading ? (
        <View style={styles.loaderContainer}>
          <Loader visible={true} size="large" overlay={false} />
        </View>
      ) : (
        <FlatList
          data={plants}
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
  },
});

export default PlantSelectionScreen;
