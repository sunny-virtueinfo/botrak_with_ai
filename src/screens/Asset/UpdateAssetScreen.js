import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import Loader from '../../components/common/Loader';
import GenericDropdown from '../../components/common/GenericDropdown';

const CONSTANT_USAGE = [
  { name: 'Medium', value: 'medium' },
  { name: 'Idle', value: 'idle' },
  { name: 'Low', value: 'low' },
  { name: 'High', value: 'high' },
];

const CONSTANT_CONDITION = [
  { name: 'Working', value: 'working' },
  { name: 'Not working', value: 'not_working' },
  { name: 'Partially working', value: 'partially_working' },
  { name: 'Scrap', value: 'scrap' },
];

const UpdateAssetScreen = ({ route, navigation }) => {
  const { asset: initialAsset, organizationId } = route.params;
  const api = useApiService();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [assetCode, setAssetCode] = useState('');
  const [assetType, setAssetType] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [condition, setCondition] = useState('');
  const [usage, setUsage] = useState('');
  const [lifeOfAsset, setLifeOfAsset] = useState('');
  const [subLocation, setSubLocation] = useState('');

  // Dropdown Data
  const [plants, setPlants] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assetRegisters, setAssetRegisters] = useState([]);

  // Selections
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedAssetRegister, setSelectedAssetRegister] = useState('');

  // Images (Mocked/Partial)
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  // Errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Determine Plant ID logic (from snippet)
      let currentPlantId =
        initialAsset.plant_id ||
        initialAsset.current_plant_id ||
        initialAsset.assetregister?.plant_id ||
        initialAsset.location?.plant_id ||
        '';

      // 2. Load Plants
      const plantsRes = await api.getPlants(organizationId);
      const loadedPlants = plantsRes.data?.plants || [];
      setPlants(loadedPlants);

      // 3. Set Initial State from passed asset
      setAssetCode(initialAsset.asset_code || '');
      setAssetType(initialAsset.asset_type || '');
      setDescription(
        initialAsset.asset_description || initialAsset.description || '',
      );
      setSupplierName(initialAsset.supplier_name || '');
      setCondition(initialAsset.condition || 'working'); // Default to value
      setUsage(initialAsset.usage || 'medium'); // Default to value
      setSubLocation(initialAsset.sub_location || '');
      setLifeOfAsset(
        initialAsset.life_of_asset ? String(initialAsset.life_of_asset) : '0',
      );
      setExistingImages(initialAsset.pictures || []);

      // Parse Date
      if (initialAsset.installation_date) {
        setInstallationDate(
          format(new Date(initialAsset.installation_date), 'yyyy-MM-dd'),
        );
      }

      // 4. Cascade Load if we have a plant
      if (currentPlantId && loadedPlants.some(p => p.id === currentPlantId)) {
        setSelectedPlant(currentPlantId);
        await fetchDependenciesForPlant(
          currentPlantId,
          initialAsset.location_id,
          initialAsset.asset_register_id,
        );
      } else {
        setSelectedPlant('');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load asset details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependenciesForPlant = async (
    plantId,
    initialLocationId = null,
    initialRegisterId = null,
  ) => {
    try {
      // Fetch Locations and Registers concurrently
      const [locRes, regRes] = await Promise.all([
        api.getLocations(organizationId, plantId),
        api.getAssetRegisters(organizationId, { selected_plant: plantId }),
      ]);

      const loadedLocations = locRes.data?.locations || [];
      const loadedRegisters = regRes.data?.asset_registers || [];

      setLocations(loadedLocations);
      setAssetRegisters(loadedRegisters);

      // Restore selections if consistent check
      if (
        initialLocationId &&
        loadedLocations.some(l => l.id === initialLocationId)
      ) {
        setSelectedLocation(initialLocationId);
      } else {
        setSelectedLocation('');
      }

      if (
        initialRegisterId &&
        loadedRegisters.some(r => r.id === initialRegisterId)
      ) {
        setSelectedAssetRegister(initialRegisterId);
      } else {
        setSelectedAssetRegister('');
      }
    } catch (e) {
      console.error('Dep fetch fail', e);
    }
  };

  const handlePlantChange = plantId => {
    setSelectedPlant(plantId);
    // Reset dependents
    setSelectedLocation('');
    setSelectedAssetRegister('');
    setLocations([]);
    setAssetRegisters([]);

    if (plantId && plantId !== 'default') {
      fetchDependenciesForPlant(plantId);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!assetCode) newErrors.assetCode = 'Asset Code is required';
    if (!assetType) newErrors.assetType = 'Asset Type is required';
    if (!lifeOfAsset) newErrors.lifeOfAsset = 'Life of Asset is required';
    if (!selectedPlant) newErrors.plant = 'Plant is required';
    if (!selectedAssetRegister) newErrors.register = 'Register is required';
    if (!selectedLocation) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) {
      showToast('Please check required fields', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const formdata = new FormData();
      formdata.append('organization_asset[asset_code]', assetCode);
      formdata.append('organization_asset[asset_description]', description);
      formdata.append('organization_asset[asset_type]', assetType);
      formdata.append('organization_asset[supplier_name]', supplierName);
      formdata.append(
        'organization_asset[installation_date]',
        installationDate,
      );
      formdata.append('organization_asset[condition]', condition);
      formdata.append('organization_asset[usage]', usage);
      formdata.append('organization_asset[location_id]', selectedLocation);
      formdata.append(
        'organization_asset[asset_register_id]',
        selectedAssetRegister,
      );
      formdata.append('organization_asset[life_of_asset]', Number(lifeOfAsset));
      formdata.append('organization_asset[sub_location]', subLocation);

      //   formdata.append('organization_asset[id]', initialAsset.id);
      formdata.append('id', initialAsset.id);

      // Deletions
      deletedImageIds.forEach(id => {
        formdata.append('organization_asset[deleted_pictures][]', id);
      });

      // New Images (Placeholder for logic)
      // images.forEach(img => { ... })

      const params = {
        id: initialAsset.id,
      };

      const response = await api.updateAsset(organizationId, formdata, params);

      if (response.data && response.data.success) {
        showToast('Asset updated successfully', 'success');
        navigation.navigate('CheckInOut', { refresh: true });
      } else {
        showToast(response.data?.error || 'Failed to update', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this asset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const data = {
                organization_asset: {
                  id: initialAsset.id,
                },
              };
              const res = await api.deleteAsset(organizationId, data);
              if (res?.data?.success) {
                showToast('Asset deleted', 'success');
                navigation.popToTop();
              } else {
                showToast('Delete failed', 'error');
              }
            } catch (e) {
              showToast('Error deleting asset', 'error');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // Image actions (Placeholder)
  const handleRemoveExistingImage = id => {
    setDeletedImageIds([...deletedImageIds, id]);
    setExistingImages(existingImages.filter(img => img.image_id !== id));
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader visible={true} size="large" overlay={false} />
      </View>
    );
  }

  return (
    <ScreenWrapper
      title="Update Asset"
      showBack={true}
      scrollable={true}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Asset Code</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <TextInput
          style={[styles.input, errors.assetCode && styles.inputError]}
          value={assetCode}
          onChangeText={setAssetCode}
          placeholder="Enter Asset Code"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Asset Type</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <TextInput
          style={[styles.input, errors.assetType && styles.inputError]}
          value={assetType}
          onChangeText={setAssetType}
          placeholder="Enter Asset Type"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Supplier Name</Text>
        <TextInput
          style={styles.input}
          value={supplierName}
          onChangeText={setSupplierName}
          placeholder="Supplier Name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Installation Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={installationDate}
          onChangeText={setInstallationDate}
          placeholder="2023-01-01"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholder="Details about asset"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Life of Asset (Years)</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <TextInput
          style={[styles.input, errors.lifeOfAsset && styles.inputError]}
          value={lifeOfAsset}
          onChangeText={setLifeOfAsset}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>

      {/* Dropdowns */}
      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Plant</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <GenericDropdown
          label="Select Plant"
          data={plants}
          value={selectedPlant}
          onValueChange={handlePlantChange}
          placeholder="Select Plant"
          error={errors.plant}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Asset Register</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <GenericDropdown
          label="Select Register"
          data={assetRegisters}
          value={selectedAssetRegister}
          onValueChange={setSelectedAssetRegister}
          placeholder="Select Asset Register"
          error={errors.register}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.star}> *</Text>
        </View>
        <GenericDropdown
          label="Select Location"
          data={locations}
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          placeholder="Select Location"
          error={errors.location}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Sub Location</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={subLocation}
          onChangeText={setSubLocation}
          multiline
          placeholder="e.g. Corner desk"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Condition</Text>
            <GenericDropdown
              label="Condition"
              data={CONSTANT_CONDITION}
              value={condition}
              onValueChange={setCondition}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Usage</Text>
            <GenericDropdown
              label="Usage"
              data={CONSTANT_USAGE}
              value={usage}
              onValueChange={setUsage}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.addImageBtn}
          onPress={() =>
            Alert.alert(
              'Info',
              'Image upload via library not available. Use Scanner to attach existing or wait for update.',
            )
          }
        >
          <Text style={styles.addImageText}>Add Image</Text>
        </TouchableOpacity>
      </View>

      {existingImages.map(img => (
        <View key={img.image_id} style={styles.imageRow}>
          <Text style={{ flex: 1, color: COLORS.text }}>
            {img.name || 'Image'}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveExistingImage(img.image_id)}
            style={styles.removeBtn}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.btnRow}>
        <GradientButton
          title={isUpdating ? 'Updating...' : 'Update'}
          onPress={handleUpdate}
          disabled={isUpdating || isDeleting}
          style={{ flex: 1, marginRight: 10 }}
        />
        <TouchableOpacity
          style={[
            styles.delBtn,
            (isUpdating || isDeleting) && { opacity: 0.5 },
          ]}
          onPress={handleDelete}
          disabled={isUpdating || isDeleting}
        >
          <Text style={styles.delBtnText}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.m, paddingBottom: 50 },
  section: { marginBottom: SPACING.m },
  rowLabel: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  star: { color: COLORS.error },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
  },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row' },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row' },

  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },

  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },

  addImageBtn: {
    backgroundColor: COLORS.text,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addImageText: { color: 'white', fontWeight: 'bold' },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: COLORS.text,
    padding: 6,
    borderRadius: 6,
  },
  removeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },

  btnRow: { flexDirection: 'row', marginTop: 20 },
  delBtn: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  delBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default UpdateAssetScreen;
