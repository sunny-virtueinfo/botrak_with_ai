import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GlassCard from '../../components/premium/GlassCard';
import AuditLocationSelectionModal from './AuditLocationSelectionModal';
import ScreenWrapper from '../../components/common/ScreenWrapper';

const AuditLocationsScreen = ({ route, navigation }) => {
  const { auditId, organizationId, plantId } = route.params;
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const api = useApiService();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locResponse = await api.getLocations(organizationId, plantId);
      if (locResponse.data) {
        const plantLocations = locResponse.data.locations.map(loc => ({
          ...loc,
          plant_id: plantId,
          plant_name: plantId,
        }));
        setLocations(plantLocations);
      }
    } catch (err) {
      console.warn(`Failed to fetch locations for plant ${plantId}`, err);
    }
  };

  const handleLocationSelect = location => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  const handleManual = () => {
    setModalVisible(false);
    navigation.navigate('AuditCategories', {
      auditId,
      locationId: selectedLocation.id,
      plantId: selectedLocation.plant_id,
      locationName: selectedLocation.name,
      organizationId,
    });
  };

  const handleQRScan = () => {
    setModalVisible(false);
    navigation.navigate('QRScanner', {
      mode: 'audit',
      auditId,
      locationId: selectedLocation.id,
      organizationId,
      plantId: selectedLocation.plant_id || plantId,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Feather name="map-pin" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>
              Plant ID: {item.plant_id || 'N/A'}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={24}
            color={COLORS.textLight}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper title="Select Location" showBack={true}>
      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />

      <AuditLocationSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onManual={handleManual}
        onQR={handleQRScan}
        locationName={selectedLocation?.name}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m },
  card: { marginBottom: SPACING.m, padding: SPACING.m, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
});

export default AuditLocationsScreen;
