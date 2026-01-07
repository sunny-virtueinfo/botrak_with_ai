import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  useRoute,
  useIsFocused,
} from '@react-navigation/native';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const CONSTANT = {
  checkInOrOut: {
    assetStatusCheckin: 'Checkin',
    assetStatusCheckout: 'Checkout',
    alreadyCheckIn: 'Asset is already checked in.',
    alreadyCheckOut: 'Asset is already checked out.',
    checkInTitle: 'Check In Asset',
    checkOutTitle: 'Check Out Asset',
    title: {
      assetCode: 'Asset Code',
      assetType: 'Asset Type',
      subLocation: 'Sub Location',
      plant: 'Plant',
      assetLocation: 'Asset Location',
      checkoutPurpose: 'Purpose',
    },
    button: {
      checkIn: 'Check In',
      checkOut: 'Check Out',
    },
    purposePlaceholder: 'Enter purpose...',
    purposeMsg: 'Please enter purpose.',
  },
  assetCheckInOut: {
    checkin: { label: 'Check-in' },
    checkOut: { label: 'Check-out' },
  },
  manualAssetScreen: {
    noPlantFound: 'No plants found.',
    noLocationFound: 'No locations found.',
  },
};

const CheckInOrOutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { showToast } = useToast();
  const api = useApiService();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState([]);
  const [assetCurrentStatus, setAssetCurrentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'plant' or 'location'

  const {
    checkInOutStatus,
    label,
    plantId,
    assetLocationID,
    assetRegisterId,
    assetId,
    assetCode,
    assetName,
    subLocation,
    organizationId,
  } = route.params || {}; // Added safety check

  useEffect(() => {
    if (isFocused && route.params) {
      const currentStatus = (checkInOutStatus || '').toLowerCase();

      if (
        label === CONSTANT.assetCheckInOut.checkin.label &&
        currentStatus !== 'checkin'
      ) {
        showToast('Asset status is not Check-in.', 'warning');
        if (Platform.OS === 'android') {
          navigation.navigate('CheckInOut');
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CheckInOut' }],
          });
        }
      } else if (
        label === CONSTANT.assetCheckInOut.checkOut.label &&
        currentStatus !== 'checkout'
      ) {
        showToast('Asset status is not Check-out.', 'warning');
        if (Platform.OS === 'android') {
          navigation.navigate('CheckInOut');
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CheckInOut' }],
          });
        }
      } else {
        initializeState();
      }
    }
  }, [isFocused]);

  const initializeState = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPlants(organizationId);
      if (res.data && res.data.success) {
        setPlants(res.data.plants || []);

        // Set initial plant if provided
        if (plantId) {
          const initialPlant = (res.data.plants || []).find(
            p => p.id === plantId,
          );
          if (initialPlant) {
            setSelectedPlant(initialPlant);
            fetchLocations(initialPlant.id, true);
          }
        }
      } else {
        showToast(CONSTANT.manualAssetScreen.noPlantFound, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load plants', 'error');
    } finally {
      setIsLoading(false);
    }

    setAssetCurrentStatus(
      label === CONSTANT.assetCheckInOut.checkin.label
        ? CONSTANT.checkInOrOut.assetStatusCheckin
        : CONSTANT.checkInOrOut.assetStatusCheckout,
    );
  };

  const fetchLocations = async (pId, isInitialLoad = false) => {
    try {
      const res = await api.getLocations(organizationId, pId);
      if (res.data && res.data.success) {
        setLocations(res.data.locations || []);

        if (
          isInitialLoad &&
          label === CONSTANT.assetCheckInOut.checkOut.label &&
          assetLocationID
        ) {
          const initialLoc = (res.data.locations || []).find(
            l => l.id === assetLocationID,
          );
          setSelectedLocation(initialLoc || null);
        } else {
          setSelectedLocation(null);
        }
      } else {
        showToast(CONSTANT.manualAssetScreen.noLocationFound, 'error');
        setLocations([]);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load locations', 'error');
    }
  };

  const handleClick = async () => {
    setIsButtonLoading(true);
    if (
      label === CONSTANT.assetCheckInOut.checkin.label &&
      !selectedLocation &&
      !description
    ) {
      // Logic from user code
    }

    if (!selectedPlant) {
      showToast('Please select a plant', 'error');
      setIsButtonLoading(false);
      return;
    }
    if (
      locations.length > 0 &&
      !selectedLocation &&
      label === CONSTANT.assetCheckInOut.checkOut.label
    ) {
      showToast('Please select a location', 'error');
      setIsButtonLoading(false);
      return;
    }

    const body = {
      checkin_checkout: {
        checkout_purpose: description,
        new_location_id: selectedLocation?.id,
        new_plant_id: selectedPlant?.id,
      },
    };
    try {
      let res;
      if (assetCurrentStatus === 'Checkout') {
        if (label === CONSTANT.assetCheckInOut.checkOut.label) {
          res = await api.checkOutAsset(
            organizationId,
            assetRegisterId,
            assetId,
            body,
          );
        } else {
          res = await api.checkInAsset(
            organizationId,
            assetRegisterId,
            assetId,
            body,
          );
        }
      } else {
        if (label === CONSTANT.assetCheckInOut.checkOut.label) {
          res = await api.checkOutAsset(
            organizationId,
            assetRegisterId,
            assetId,
            body,
          );
        } else {
          res = await api.checkInAsset(
            organizationId,
            assetRegisterId,
            assetId,
            body,
          );
        }
      }

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Success', 'success');
        navigation.goBack(); // Go back to module root
      } else {
        showToast(res.data?.error || 'Error occurred', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsButtonLoading(false);
    }
  };

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
            data={pickerType === 'plant' ? plants : locations}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  if (pickerType === 'plant') {
                    setSelectedPlant(item);
                    fetchLocations(item.id);
                  } else {
                    setSelectedLocation(item);
                  }
                  setPickerVisible(false);
                }}
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

  const getHeaderTitle = () => {
    return label === CONSTANT.assetCheckInOut.checkin.label
      ? CONSTANT.checkInOrOut.checkInTitle
      : CONSTANT.checkInOrOut.checkOutTitle || 'Check In/Out';
  };

  return (
    <ScreenWrapper title={getHeaderTitle()} showBack={true} scrollable={false}>
      <Loader visible={isLoading} />
      <Loader
        visible={isButtonLoading}
        overlay={true}
        message="Processing..."
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!isLoading && (
            <View style={{ gap: 15 }}>
              {/* Asset Info Card */}
              {/* ... content ... */}

              {/* Submit Button */}
              <TouchableOpacity style={styles.button} onPress={handleClick}>
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>
                    {label === CONSTANT.assetCheckInOut.checkin.label
                      ? CONSTANT.checkInOrOut.button.checkIn
                      : CONSTANT.checkInOrOut.button.checkOut}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        {renderPickerModal()}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.m },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    ...SHADOWS.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: '#E5E7EB' },
  label: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  value: { fontSize: 14, color: COLORS.text, fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  dropdownText: { fontSize: 16, color: COLORS.text },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  button: { marginTop: SPACING.m },
  gradientButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

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

export default CheckInOrOutScreen;
