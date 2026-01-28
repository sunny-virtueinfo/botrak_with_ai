import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  useCameraDevices,
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useToast } from '../../context/ToastContext';
import { useApiService } from '../../services/ApiService';
import GradientButton from '../../components/premium/GradientButton';
import { useCustomModal } from '../../context/ModalContext';

const QRScannerScreen = ({ navigation, route }) => {
  const { showToast } = useToast();
  const { showModal } = useCustomModal();
  const api = useApiService();
  const { mode, organizationId, auditId, plantId } = route.params || {};
  console.log('QRScanner audit params:', {
    mode,
    organizationId,
    auditId,
    plantId,
    params: route.params,
  });
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();

  const device = useCameraDevice('back');

  const [hasPermission, setHasPermission] = useState(false);

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    route.params?.locationId,
  );
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const getSelectedLocationName = () => {
    const loc = locations.find(l => l.id == selectedLocation);
    return loc ? loc.name : 'Select Result Location';
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [condition, setCondition] = useState('working');
  const [usage, setUsage] = useState('medium');
  const [remark, setRemark] = useState('');
  const [locationMismatch, setLocationMismatch] = useState(false);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  React.useEffect(() => {
    if (mode === 'audit' && organizationId) {
      fetchLocations();
    }
  }, [mode, organizationId]);

  const fetchLocations = async () => {
    try {
      const res = await api.getLocations(organizationId, plantId);
      console.log('getLocations res:', JSON.stringify(res.data, null, 2));
      if (res.data && (res.data.locations || res.data.data)) {
        setLocations(res.data.locations || res.data.data);
      }
    } catch (e) {
      console.error('Failed to load locations', e);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedTimeRef = useRef(0);

  const onCodeScanned = async code => {
    const now = Date.now();
    if (now - lastScannedTimeRef.current < 1500) return;

    if (modalVisible || locationModalVisible || isProcessing) return;

    lastScannedTimeRef.current = now;

    try {
      setIsProcessing(true);
      let response;

      if (mode === 'audit') {
        const params = {
          organization_asset: JSON.stringify({
            qr_code: code,
            location_id: selectedLocation,
            audit_id: auditId,
          }),
          from_mobile: true,
        };

        response = await api.searchAssets(organizationId, params);
      } else {
        response = await api.scanAssetSuccessOnly(organizationId, code);
      }

      const asset =
        response.data.audit_log ||
        response.data.organization_asset ||
        response.data.data;

      if (response.data.success && asset) {
        if (mode === 'audit') {
          setScannedAsset(asset);
          setCondition('working');
          setUsage('medium');
          setRemark('');
          const isMismatch =
            response.data.location_mismatch ||
            (response.data.audit_log &&
              response.data.audit_log.location_mismatch);
          setLocationMismatch(!!isMismatch);

          setModalVisible(true);
          setIsProcessing(false);
        } else {
          handleOtherModes(asset, code);
          setTimeout(() => setIsProcessing(false), 2000);
        }
      } else {
        const errorMsg =
          response.data.error || `Asset with QR ${code} not found`;
        showToast(errorMsg, 'error');
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleOtherModes = (asset, code) => {
    showToast('Asset found!', 'success');
    if (mode === 'check_in') {
      navigation.navigate('CheckInOrOut', {
        label: 'Check-in',
        checkInOutStatus: 'checkin',
        plantId: asset.current_plant_id || asset.plant_id,
        assetLocationID: asset.current_location_id || asset.location_id,
        assetRegisterId: asset.asset_register_id,
        assetId: asset.id,
        assetCode: asset.asset_code,
        assetName: asset.asset_type || asset.name,
        subLocation: asset.sub_location,
        organizationId: asset.organization_id || organizationId,
        checkInOutStatus: asset.checkin_checkout,
      });
    } else if (mode === 'check_out') {
      navigation.navigate('CheckInOrOut', {
        label: 'Check-out',
        plantId: asset.current_plant_id || asset.plant_id,
        assetLocationID: asset.current_location_id || asset.location_id,
        assetRegisterId: asset.asset_register_id,
        assetId: asset.id,
        assetCode: asset.asset_code,
        assetName: asset.asset_type || asset.name,
        subLocation: asset.sub_location,
        organizationId: asset.organization_id || organizationId,
        checkInOutStatus: asset.checkin_checkout,
      });
    } else if (mode === 'modify') {
      navigation.navigate('UpdateAsset', {
        asset,
        organizationId: asset.organization_id || organizationId,
      });
    } else if (mode === 'reminder') {
      navigation.navigate('AddReminder', {
        organizationId: asset.organization_id || organizationId,
        assetCode: asset.asset_code,
        assetId: asset.id,
      });
    } else if (route.params?.isForAssignment) {
      navigation.navigate('AssetAssignmentDetail', {
        scannedAsset: asset,
        organizationId: asset.organization_id || organizationId,
      });
    } else {
      navigation.replace('AssetDetail', {
        asset,
        organizationId: asset.organization_id || organizationId,
      });
    }
  };

  const handleSubmitVerification = async () => {
    try {
      const body = {
        organization_asset: {
          condition: condition,
          usage: usage,
          remark: remark,
          audit_id: auditId,
          location_id: selectedLocation,
        },
      };

      const res = await api.submitAuditLog(
        organizationId,
        auditId,
        scannedAsset.id,
        body,
      );

      setModalVisible(false);
      showToast('Asset Verified Successfully!', 'success');
    } catch (e) {
      console.error(e);
      showModal('Error', 'Failed to save audit entry');
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes.length > 0 && codes[0].value) {
        onCodeScanned(codes[0].value);
      }
    },
  });

  if (!hasPermission)
    return (
      <View style={styles.container}>
        <Text>No Camera Permission</Text>
      </View>
    );
  if (device == null)
    return (
      <View style={styles.container}>
        <Text>No Camera Device</Text>
      </View>
    );

  const scanSize = 250;
  const overlayColor = 'rgba(0,0,0,0.5)';

  const isCameraActive =
    !modalVisible && !locationModalVisible && !isProcessing && isFocused;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        codeScanner={codeScanner}
        photo={true}
        video={false}
        audio={false}
        enableZoomGesture={false}
      />

      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: overlayColor }} />

        <View style={{ flexDirection: 'row', height: scanSize }}>
          <View style={{ flex: 1, backgroundColor: overlayColor }} />

          <View
            style={{ width: scanSize, height: scanSize, position: 'relative' }}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <View style={{ flex: 1, backgroundColor: overlayColor }} />
        </View>

        <View style={{ flex: 1, backgroundColor: overlayColor }} />
      </View>

      <TouchableOpacity
        style={styles.floatingBackBtn}
        onPress={() => navigation.goBack()}
      >
        <Feather name="arrow-left" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <View style={{ flex: 1 }} />

        <Text style={styles.scanText}>Align QR code within the frame</Text>

        {mode === 'audit' && (
          <View style={styles.auditControls}>
            <View style={styles.locationContainer}>
              <Text style={styles.whiteText}>Results Location:</Text>
              <TouchableOpacity
                style={styles.locationBadge}
                onPress={() => setLocationModalVisible(true)}
              >
                <Text style={styles.locationText}>
                  {getSelectedLocationName()}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color="white"
                  style={{ marginLeft: 5 }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Stop Audit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location Selector Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.locationContainer, { marginBottom: 15 }]}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={locations}
              keyExtractor={item => item.id.toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationItem,
                    selectedLocation == item.id && styles.activeLocationItem,
                  ]}
                  onPress={() => {
                    setSelectedLocation(item.id);
                    setLocationModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.locationItemText,
                      selectedLocation == item.id && styles.activeLocationText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedLocation == item.id && (
                    <Feather name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Asset</Text>
            {scannedAsset?.organizationasset && (
              <Text style={styles.assetName}>
                {scannedAsset?.organizationasset?.asset_code ||
                  scannedAsset?.asset_code}
              </Text>
            )}

            {locationMismatch && (
              <Text style={styles.errorText}>Location mismatch</Text>
            )}

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
            <TextInput
              style={styles.input}
              placeholder="Add notes..."
              value={remark}
              onChangeText={setRemark}
              multiline
            />

            <GradientButton
              title="Submit Verification"
              onPress={handleSubmitVerification}
              style={{ marginTop: SPACING.l }}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: SPACING.m, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.textLight }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 50,
    alignItems: 'center',
    position: 'absolute', // Ensure this overlays properly
    bottom: 0,
    zIndex: 5,
  },
  scanText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  auditControls: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  stopBtn: {
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  whiteText: { color: 'white', fontWeight: 'bold' },
  locationBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: { color: 'white' },
  btn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  floatingBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },

  // Mask Frame Corners
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  errorText: {
    color: COLORS.error,
    fontWeight: 'bold',
    marginBottom: SPACING.m,
    fontSize: 16,
  },
  assetName: { fontSize: 16, color: COLORS.primary, marginBottom: SPACING.l },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    marginBottom: SPACING.s,
    borderColor: COLORS.border,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textLight },
  activeChipText: { color: 'white', fontWeight: 'bold' },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.m,
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeLocationItem: {
    backgroundColor: COLORS.surface,
  },
  locationItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  activeLocationText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default QRScannerScreen;
