import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Feather from 'react-native-vector-icons/Feather';
import Loader from './Loader';

const OrganizationSwitchModal = ({ visible, onClose, onSelect }) => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempSelectedOrg, setTempSelectedOrg] = useState(null);
  const api = useApiService();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      loadOrganizations();
    }
  }, [visible]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMyOrganizations();
      if (response.data.my_organizations) {
        const orgs = response.data.my_organizations;
        setOrganizations(orgs);

        // Set initial temp selection to current user org
        // Prioritize the locally active 'organization_id' over 'recent_organization_id'
        const activeId =
          user?.organization_id ||
          user?.active_organization_id ||
          user?.recent_organization_id;

        const currentOrg = orgs.find(o => o.organization_id == activeId);
        if (currentOrg) {
          setTempSelectedOrg(currentOrg);
        }
      }
    } catch (e) {
      console.error('Failed to load organizations', e);
    } finally {
      setIsLoading(false);
    }
  };

  const hasActivePlan = org => {
    // Logic from user request: check is_plan_active
    return org.is_plan_active === true || org.is_plan_active === 1;
  };

  const handleOrgSelect = org => {
    if (!hasActivePlan(org)) {
      showToast('This organization does not have an active plan.', 'error');
      return;
    }
    setTempSelectedOrg(org);
  };

  const handleConfirm = () => {
    if (tempSelectedOrg) {
      onSelect(tempSelectedOrg);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContentInner}>
            <View style={styles.iconBadge}>
              <Feather name="briefcase" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Change Organization</Text>
            <Text style={styles.modalSubtitle}>
              Select an organization to switch to
            </Text>
          </View>

          {isLoading ? (
            <Loader visible={true} size="large" overlay={false} />
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {organizations.map((org, index) => {
                const hasPlan = hasActivePlan(org);
                const isSelected =
                  tempSelectedOrg?.organization_id == org.organization_id;

                // Identify active/current org from context separately if needed,
                // but here we just show what is selected in the modal state.

                return (
                  <TouchableOpacity
                    key={org.organization_id}
                    style={[
                      styles.orgItem,
                      isSelected && styles.selectedItem,
                      !hasPlan && styles.disabledItem,
                      // index === organizations.length - 1 && {
                      //   borderBottomWidth: 0,
                      // },
                    ]}
                    onPress={() => handleOrgSelect(org)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.orgName,
                        isSelected && { fontWeight: 'bold' },
                      ]}
                    >
                      {org.organization_name}
                    </Text>

                    <View
                      style={[
                        styles.radioButton,
                        isSelected && styles.radioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.changeButton]}
              onPress={handleConfirm}
            >
              <Text style={[styles.changeButtonText, styles.buttonText]}>
                Change
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontStyle: FONTS.italic,
  },
  list: {
    paddingBottom: 10,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContentInner: {
    width: '100%',
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight + '20', // transparent primary
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  selectedItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  disabledItem: {
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.primary + '10',
  },
  changeButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
});

export default OrganizationSwitchModal;
