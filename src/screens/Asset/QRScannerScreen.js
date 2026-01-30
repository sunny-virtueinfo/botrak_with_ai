import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  useCameraDevices,
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useToast } from '../../context/ToastContext';
import { useApiService } from '../../services/ApiService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useCustomModal } from '../../context/ModalContext';

const QRScannerScreen = ({ navigation, route }) => {
  const { showToast } = useToast();
  const { showModal } = useCustomModal();
  const api = useApiService();
  const { mode, organizationId, auditId, plantId } = route.params || {};

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
    if (now - lastScannedTimeRef.current < 2000) return;

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
        showToast(`Asset with QR ${code} not found`, 'error');
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

      await api.submitAuditLog(organizationId, auditId, scannedAsset.id, body);

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
        <Text style={{ color: 'white' }}>No Camera Permission</Text>
      </View>
    );
  if (device == null)
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>No Camera Device</Text>
      </View>
    );

  const scanSize = 260;
  const overlayColor = 'rgba(0,0,0,0.6)';

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
        enableZoomGesture={false}
      />

      {/* Custom Overlay */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: overlayColor }} />
        <View style={{ flexDirection: 'row', height: scanSize }}>
          <View style={{ flex: 1, backgroundColor: overlayColor }} />
          <View style={{ width: scanSize, height: scanSize }}>
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

      <View style={styles.controlsContainer}>
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
        animationType="fade"
        transparent
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLocationModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <Pressable
              style={styles.modalContent}
              onPress={e => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Verify Asset</Text>
              {scannedAsset?.organizationasset && (
                <Text style={styles.assetName}>
                  {scannedAsset?.organizationasset?.asset_code ||
                    scannedAsset?.asset_code}
                </Text>
              )}

              {locationMismatch && (
                <View style={styles.errorBadge}>
                  <Feather name="alert-triangle" size={16} color="white" />
                  <Text style={styles.errorText}>Location mismatch</Text>
                </View>
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
              <Input
                value={remark}
                onChangeText={setRemark}
                placeholder="Add notes..."
                area
                style={{ height: 80 }}
              />

              <View
                style={{ marginTop: SPACING.l, flexDirection: 'row', gap: 10 }}
              >
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit Verification"
                  variant="primary"
                  onPress={handleSubmitVerification}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
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
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  scanText: {
    color: 'white',
    fontSize: 15,
    marginBottom: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    fontFamily: FONTS.medium,
  },

  auditControls: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stopBtn: {
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  whiteText: { color: 'white', fontWeight: 'bold', fontFamily: FONTS.bold },
  locationBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: { color: 'white', fontFamily: FONTS.medium },
  btnText: { color: 'white', fontWeight: 'bold', fontFamily: FONTS.bold },

  floatingBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    ...SHADOWS.medium,
  },

  // Mask Frame Corners
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 5,
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.l,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.hard,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  errorBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING.m,
    gap: 6,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  assetName: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: SPACING.l,
    fontFamily: FONTS.medium,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    marginTop: SPACING.s,
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
    marginBottom: 4,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.medium },
  activeChipText: { color: 'white', fontWeight: 'bold' },

  locationItem: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeLocationItem: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  locationItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  activeLocationText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default QRScannerScreen;
