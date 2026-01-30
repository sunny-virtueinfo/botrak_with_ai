import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useToast } from '../../context/ToastContext';
import { useCustomModal } from '../../context/ModalContext';
import { format } from 'date-fns';
import Loader from '../../components/common/Loader';
import NewPickerForPlant from '../../components/common/NewPickerForPlant';
import NewLocationPicker from '../../components/common/NewLocationPicker';
import CustomDropDown from '../../components/common/CustomDropDown';

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
  const { showModal } = useCustomModal();

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
  const [newImages, setNewImages] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const checkPermissionForEditImage = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          editImage();
        } else {
          showToast('Camera permission denied', 'error');
        }
      } else {
        editImage();
      }
    } catch (error) {
      console.log('Permission error', error);
      showToast('Failed to request permission', 'error');
    }
  };

  const editImage = async () => {
    try {
      const result = await launchCamera({
        title: 'Select Asset',
        quality: 0.6,
        mediaType: 'photo',
        saveToPhotos: false,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        showToast(result.errorMessage || 'Camera error', 'error');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        if (capturedImage && capturedImage.uri) {
          const imageWithId = {
            ...capturedImage,
            tempId: Date.now().toString(),
          };
          setNewImages([...newImages, imageWithId]);
        } else {
          showToast('Failed to capture image', 'error');
        }
      }
    } catch (error) {
      console.log('Camera catch error', error);
      showToast('An error occurred opening the camera', 'error');
    }
  };
  const handleSelectImage = checkPermissionForEditImage;

  const handleRemoveNewImage = tempId => {
    setNewImages(prev => prev.filter(img => img.tempId !== tempId));
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      let currentPlantId =
        initialAsset.plant_id ||
        initialAsset.current_plant_id ||
        initialAsset.assetregister?.plant_id ||
        initialAsset.location?.plant_id ||
        '';

      const plantsRes = await api.getPlants(organizationId);
      const loadedPlants = plantsRes.data?.plants || [];
      setPlants(loadedPlants);
      setAssetCode(initialAsset.asset_code || '');
      setAssetType(initialAsset.asset_type || '');
      setDescription(
        initialAsset.asset_description || initialAsset.description || '',
      );
      setSupplierName(initialAsset.supplier_name || '');
      setCondition(initialAsset.condition || 'working');
      setUsage(initialAsset.usage || 'medium');
      setSubLocation(initialAsset.sub_location || '');
      setLifeOfAsset(
        initialAsset.life_of_asset ? String(initialAsset.life_of_asset) : '0',
      );
      setExistingImages(initialAsset.pictures || []);

      if (initialAsset.installation_date) {
        setInstallationDate(
          format(new Date(initialAsset.installation_date), 'yyyy-MM-dd'),
        );
      }

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
      const [locRes, regRes] = await Promise.all([
        api.getLocations(organizationId, plantId),
        api.getAssetRegisters(organizationId, { selected_plant: plantId }),
      ]);

      const loadedLocations = locRes.data?.locations || [];
      const loadedRegisters = regRes.data?.asset_registers || [];

      setLocations(loadedLocations);
      setAssetRegisters(loadedRegisters);

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

  const handlePlantChange = plant => {
    const plantId = plant?.id || plant;
    setSelectedPlant(plantId);
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
      formdata.append('organization_asset[life_of_asset]', String(lifeOfAsset));
      formdata.append('organization_asset[sub_location]', subLocation);

      formdata.append('id', String(initialAsset.id));

      deletedImageIds.forEach(id => {
        formdata.append('organization_asset[deleted_pictures][]', String(id));
      });

      newImages.forEach(img => {
        if (img && img.uri) {
          formdata.append('organization_asset[pictures][]', {
            uri: img.uri,
            name: img.name || 'image.jpg',
            type: img.type || 'image/jpeg',
          });
        }
      });

      const response = await api.updateAsset(organizationId, formdata, {});
      if (response.data && response.data.success) {
        showToast('Asset updated successfully', 'success');
        navigation.navigate('Dashboard', {
          screen: 'CheckInOut',
          params: { refresh: true },
        });
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
    showModal('Confirm Delete', 'Are you sure you want to delete this asset?', [
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
    ]);
  };

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
      <Card variant="elevated" style={styles.card}>
        <View style={styles.section}>
          <Input
            label="Asset Code *"
            value={assetCode}
            onChangeText={setAssetCode}
            placeholder="Enter Asset Code"
            error={errors.assetCode}
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Asset Type *"
            value={assetType}
            onChangeText={setAssetType}
            placeholder="Enter Asset Type"
            error={errors.assetType}
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Supplier Name"
            value={supplierName}
            onChangeText={setSupplierName}
            placeholder="Supplier Name"
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Installation Date (YYYY-MM-DD)"
            value={installationDate}
            onChangeText={setInstallationDate}
            placeholder="2023-01-01"
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Details about asset"
            multiline
            style={{ height: 80 }}
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Life of Asset (Years) *"
            value={lifeOfAsset}
            onChangeText={setLifeOfAsset}
            keyboardType="numeric"
            placeholder="0"
            error={errors.lifeOfAsset}
          />
        </View>

        {/* Dropdowns */}
        <View style={styles.section}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>Plant *</Text>
          </View>
          <NewPickerForPlant
            plants={plants}
            selected={selectedPlant}
            valueChange={handlePlantChange}
            error={errors.plant}
            pickerStyle={styles.dropdownBtn}
          />
          {errors.plant && <Text style={styles.errorText}>{errors.plant}</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>Asset Register *</Text>
          </View>
          <CustomDropDown
            label="Select Register"
            data={assetRegisters}
            value={selectedAssetRegister}
            onValueChange={val => setSelectedAssetRegister(val?.id ?? val)}
            placeholder="Select Asset Register"
            error={errors.register}
            style={styles.dropdownBtn}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>Location *</Text>
          </View>
          <NewLocationPicker
            locations={locations}
            selected={selectedLocation}
            valueChange={val => setSelectedLocation(val?.id || val)}
            error={errors.location}
            pickerStyle={styles.dropdownBtn}
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Input
            label="Sub Location"
            value={subLocation}
            onChangeText={setSubLocation}
            placeholder="e.g. Corner desk"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Condition</Text>
              <CustomDropDown
                label="Condition"
                data={CONSTANT_CONDITION}
                value={condition}
                onValueChange={val => setCondition(val?.value ?? val)}
                style={styles.dropdownBtn}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Usage</Text>
              <CustomDropDown
                label="Usage"
                data={CONSTANT_USAGE}
                value={usage}
                onValueChange={val => setUsage(val?.value ?? val)}
                style={styles.dropdownBtn}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Button
            title="Add Image"
            icon="camera"
            variant="secondary"
            onPress={handleSelectImage}
            style={styles.addImageBtn}
          />
        </View>

        {existingImages.map(img => (
          <View key={img.image_id} style={styles.imageRow}>
            <Image
              source={{ uri: img.image_url || img.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 12,
                  fontFamily: FONTS.medium,
                }}
              >
                {img.name || 'Existing Image'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveExistingImage(img.image_id)}
              style={styles.removeBtn}
            >
              <Feather name="trash-2" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}

        {newImages.map((img, index) => {
          if (!img || !img.uri) return null;
          return (
            <View key={img.tempId || `new-${index}`} style={styles.imageRow}>
              <Image
                source={{ uri: img.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 12,
                    fontFamily: FONTS.medium,
                  }}
                >
                  New Image {index + 1}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveNewImage(img.tempId)}
                style={styles.removeBtn}
              >
                <Feather name="trash-2" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>

      <View style={styles.btnRow}>
        <Button
          title={isUpdating ? 'Updating...' : 'Update Asset'}
          onPress={handleUpdate}
          disabled={isUpdating || isDeleting}
          variant="primary"
          style={{ flex: 1 }}
        />
        <Button
          title={isDeleting ? 'Deleting...' : 'Delete'}
          onPress={handleDelete}
          disabled={isUpdating || isDeleting}
          variant="ghost"
          style={[
            styles.delBtn,
            { flex: 0.5, borderColor: COLORS.error, borderWidth: 1 },
          ]}
          textStyle={{ color: COLORS.error }}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.m, paddingBottom: 50 },
  card: { padding: SPACING.m, borderRadius: 16 },
  section: { marginBottom: SPACING.m },
  rowLabel: { flexDirection: 'row', marginBottom: 6 },
  label: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  dropdownBtn: {
    backgroundColor: COLORS.inputBackground || COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row' },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  removeBtn: {
    padding: 8,
  },
  btnRow: { flexDirection: 'row', marginTop: 24, marginBottom: 40, gap: 10 },
  delBtn: {
    backgroundColor: 'transparent',
  },
});

export default UpdateAssetScreen;
