import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const AddNewAssetScreen = ({ route, navigation }) => {
  const { auditId, locationId, organizationId, plantId } = route.params;
  const api = useApiService();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategoriesByLocation(
        organizationId,
        plantId,
        locationId,
      );
      const assetTypes = response.data.asset_type || response.data.data;
      if (assetTypes && Array.isArray(assetTypes)) {
        const formattedCategories = assetTypes.map(item => {
          if (typeof item === 'string') {
            return { id: item, name: item };
          }
          return item;
        });
        setCategories(formattedCategories);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load asset types');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setAssetType(null);
  };

  const handleSubmit = async () => {
    if (!name || !assetType) {
      Alert.alert('Validation', 'Name and Asset Type are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        description,
        category_id: assetType.id,
        location_id: locationId,
        audit_id: auditId,
        status: 'active', // Default status
      };

      const response = await api.addNewAuditAssets(organizationId, payload);

      if (response.data.success) {
        Alert.alert('Success', 'Asset added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add asset');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper
      title="Add New Asset"
      showBack={true}
      scrollable={true}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.formCard}>
        <Text style={styles.title}>Add New Asset</Text>

        <Text style={styles.label}>
          Asset Name <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter asset name"
        />

        <Text style={styles.label}>
          Asset Type <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
        <View style={styles.typeContainer}>
          {loading ? (
            <Loader visible={true} size="small" overlay={false} />
          ) : (
            categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.typeChip,
                  assetType?.id === cat.id && styles.activeTypeChip,
                ]}
                onPress={() => setAssetType(cat)}
              >
                <Text
                  style={[
                    styles.typeText,
                    assetType?.id === cat.id && styles.activeTypeText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          multiline
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <View style={{ width: SPACING.m }} />
          <View style={{ flex: 1 }}>
            <GradientButton
              title={submitting ? 'Submitting...' : 'Submit'}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.m },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: SPACING.l,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.l,
    fontFamily: FONTS.bold,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTypeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: { fontSize: 12, color: COLORS.textLight },
  activeTypeText: { color: 'white', fontWeight: 'bold' },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resetBtn: { padding: SPACING.m },
  resetText: { color: COLORS.textLight, fontWeight: '600' },
});

export default AddNewAssetScreen;
