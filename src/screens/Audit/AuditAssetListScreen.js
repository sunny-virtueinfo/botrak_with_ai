import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService'; // Import hook
import GlassCard from '../../components/premium/GlassCard';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const AuditAssetListScreen = ({ route, navigation }) => {
  const { auditId, locationId, categoryId, title, organizationId, plantId } =
    route.params;
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [loading, setLoading] = useState(true);

  const api = useApiService();

  // Form State
  const [condition, setCondition] = useState('working');
  const [usage, setUsage] = useState('medium');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadAssets();
  }, [categoryId]);

  // Handle Scanned Asset from QR
  useEffect(() => {
    if (route.params?.scannedAsset) {
      const scanned = route.params.scannedAsset;
      handleAssetSelect(scanned);
      // Clear param to prevent loop
      navigation.setParams({ scannedAsset: null });
    }
  }, [route.params?.scannedAsset]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      let response;
      if (categoryId) {
        // Specific Category -> Use Filter API
        const params = {
          organization_asset: JSON.stringify({
            plant_id: plantId,
            asset_type: categoryId, // Asset Name string
            location_id: locationId,
          }),
          audit_id: auditId,
          page: 1,
          from_mobile: true,
        };
        response = await api.filterAssetsByType(organizationId, params);
      } else {
        // All Assets -> Use Search API
        const params = {
          organization_asset: JSON.stringify({
            location_id: locationId,
            audit_id: auditId,
          }),
          from_mobile: true,
        };
        response = await api.searchAssets(organizationId, params);
      }

      if (response.data.success) {
        // Check for 'organization_asset' (Filter API) or 'data' (Search API)
        setAssets(response.data.organization_asset || response.data.data || []);
      } else {
        setAssets([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = asset => {
    setSelectedAsset(asset);
    setCondition('working');
    setUsage('medium');
    setRemark('');
    setModalVisible(true);
  };

  const handleSubmitAudit = async () => {
    try {
      const detailedNotes = `Condition: ${condition}, Usage: ${usage}, Remark: ${remark}`;
      const assetsData = [
        {
          id: selectedAsset.id,
          status: selectedAsset.status || 'available',
          notes: detailedNotes,
        },
      ];

      await api.submitAuditEntry(organizationId, auditId, assetsData);

      setModalVisible(false);
      alert('Asset Verified!');
      loadAssets();
    } catch (e) {
      console.error(e);
      alert('Failed to save audit entry');
    }
  };

  const handleAddNewAsset = () => {
    navigation.navigate('AddNewAsset', {
      auditId,
      locationId,
      organizationId,
      plantId,
    });
  };

  const handleAllAssets = () => {
    navigation.push('AuditAssetList', {
      auditId,
      locationId,
      categoryId: null, // All
      title: 'All Assets',
      organizationId,
      plantId,
    });
  };

  const renderItem = ({ item }) => (
    <Pressable onPress={() => handleAssetSelect(item)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  item.checked === true
                    ? COLORS.checked.true
                    : COLORS.checked.false,
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.asset_code || item.name}</Text>
          </View>
          <Feather
            name="check-circle"
            size={24}
            color={
              item.checked === true ? COLORS.checked.true : COLORS.checked.false
            }
          />
        </View>
      </GlassCard>
    </Pressable>
  );

  return (
    <ScreenWrapper title={title} showBack={true}>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Loader visible={true} size="large" overlay={false} />
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No assets found here.</Text>
          }
        />
      )}

      {/* FAB Options Overlay */}
      {showFabOptions && (
        <View style={styles.fabOptionsContainer}>
          <TouchableOpacity
            style={styles.fabOption}
            onPress={handleAddNewAsset}
          >
            <Text style={styles.fabOptionText}>Add New Asset</Text>
            <View style={styles.miniFab}>
              <Feather name="plus" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabOption} onPress={handleAllAssets}>
            <Text style={styles.fabOptionText}>All Assets</Text>
            <View style={styles.miniFab}>
              <Feather name="list" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
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
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Audit Form Modal */}
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
            <Text style={styles.assetName}>
              {selectedAsset?.name || selectedAsset?.asset_code}
            </Text>

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
              onPress={handleSubmitAudit}
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
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m },
  card: { marginBottom: SPACING.m, padding: SPACING.m, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: SPACING.m,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textLight },

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

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.medium,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'flex-end',
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  fabOptionText: {
    marginRight: SPACING.m,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    ...SHADOWS.soft,
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
});

export default AuditAssetListScreen;
