import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
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
import NewPickerForPlant from '../../components/common/NewPickerForPlant';
import NewLocationPicker from '../../components/common/NewLocationPicker';
import CustomDropDown from '../../components/common/CustomDropDown';

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

const Capitalize = str => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};

const CheckInOrOutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { showToast } = useToast();
  const api = useApiService();
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
  } = route.params || {};

  const [selectedLocation, setSelectedLocation] = useState(assetLocationID);
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState([]);
  const [assetCurrentStatus, setAssetCurrentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);

  useEffect(() => {
    if (isFocused && route.params) {
      const currentStatus = (checkInOutStatus || '').toLowerCase();

      if (
        label === CONSTANT.assetCheckInOut.checkin.label &&
        currentStatus === 'checkin'
      ) {
        showToast('Asset status is not Check-in.', 'warning');
        if (Platform.OS === 'android') {
          navigation.navigate('CheckInOrOut');
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CheckInOrOut' }],
          });
        }
      } else if (
        label === CONSTANT.assetCheckInOut.checkOut.label &&
        currentStatus === 'checkout'
      ) {
        showToast('Asset status is not Check-out.', 'warning');
        if (Platform.OS === 'android') {
          navigation.navigate('CheckInOrOut');
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CheckInOrOut' }],
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
      const res = await api.getPlants(organizationId || undefined);
      if (res.data && res.data.success) {
        setPlants(res.data.plants || []);

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
      const res = await api.getLocations(organizationId || undefined, pId);
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
            organizationId || undefined,
            assetRegisterId,
            assetId,
            body,
          );
        } else {
          res = await api.checkInAsset(
            organizationId || undefined,
            assetRegisterId,
            assetId,
            body,
          );
        }
      } else {
        if (label === CONSTANT.assetCheckInOut.checkOut.label) {
          res = await api.checkOutAsset(
            organizationId || undefined,
            assetRegisterId,
            assetId,
            body,
          );
        } else {
          res = await api.checkInAsset(
            organizationId || undefined,
            assetRegisterId,
            assetId,
            body,
          );
        }
      }

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Success', 'success');
        navigation.goBack();
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

  const getHeaderTitle = () => {
    return label === CONSTANT.assetCheckInOut.checkin.label
      ? CONSTANT.checkInOrOut.checkInTitle
      : CONSTANT.checkInOrOut.checkOutTitle || 'Check In/Out';
  };

  const constant = CONSTANT;
  const theme = {
    card: styles.card,
    labelText: styles.label,
    valueText: styles.value,
    button: { backgroundColor: COLORS.primary }, // Mock for color usage
    buttonText: styles.buttonText,
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
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[theme.card, { gap: 5, padding: 15 }]}>
            <View style={styles.headingContainer}>
              <Text style={theme.labelText}>
                {constant.checkInOrOut.title.assetCode}
              </Text>
              <Text style={theme.valueText}>{assetCode}</Text>
            </View>
            <View style={styles.headingContainer}>
              <Text style={theme.labelText}>
                {constant.checkInOrOut.title.assetType}
              </Text>
              <Text style={theme.valueText}>{Capitalize(assetName)}</Text>
            </View>
            <View style={styles.headingContainer}>
              <Text style={theme.labelText}>
                {constant.checkInOrOut.title.subLocation}
              </Text>
              <Text style={theme.valueText}>{subLocation || '-'}</Text>
            </View>
          </View>

          {label === constant.assetCheckInOut.checkOut.label && (
            <>
              <View style={[theme.card, { gap: 5, padding: 15 }]}>
                <View>
                  <Text style={styles.title}>
                    {constant.checkInOrOut.title.plant}
                  </Text>
                  <NewPickerForPlant
                    plants={plants}
                    selected={selectedPlant}
                    valueChange={value => {
                      setSelectedPlant(value);
                      fetchLocations(value?.id || value, false);
                    }}
                    pickerStyle={{ height: 42 }}
                  />
                </View>

                <View>
                  <Text style={[styles.title, { marginTop: 15 }]}>
                    {constant.checkInOrOut.title.assetLocation}
                  </Text>
                  <NewLocationPicker
                    selected={selectedLocation}
                    locations={locations}
                    valueChange={value => setSelectedLocation(value)}
                    pickerStyle={{ height: 42 }}
                  />
                </View>

                <View>
                  <Text style={[styles.title, { marginTop: 15 }]}>
                    {constant.checkInOrOut.title.checkoutPurpose}
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder={constant.checkInOrOut.purposePlaceholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
              </View>
            </>
          )}
          {isButtonLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.button.backgroundColor}
            />
          ) : (
            <TouchableOpacity
              style={styles.gradientButton}
              onPress={handleClick}
            >
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  width: '100%',
                  ...SHADOWS.medium,
                }}
              >
                <Text style={theme.buttonText}>
                  {label === constant.assetCheckInOut.checkin.label
                    ? constant.checkInOrOut.button.checkIn
                    : constant.checkInOrOut.button.checkOut}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.m },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16, // More rounded
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.medium, // Better depth
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.4)', // subtle border
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
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
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  dropdownText: { fontSize: 16, color: COLORS.text },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  button: { marginTop: SPACING.m },
  gradientButton: {
    paddingTop: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
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
    borderBottomColor: COLORS.border,
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
  container: {
    padding: SPACING.m,
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: '600',
  },
});

export default CheckInOrOutScreen;
