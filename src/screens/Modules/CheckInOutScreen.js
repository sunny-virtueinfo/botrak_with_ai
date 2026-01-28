import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS } from '../../theme';
import GlassCard from '../../components/premium/GlassCard';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import ActionCard from '../../components/common/ActionCard';
import { useAuth } from '../../context/AuthContext';
import { getUserRolesObject } from '../../utils/RoleManager';

const CheckInOutScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const params = route.params || {};
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState(null);

  const userRoles = getUserRolesObject(user?.role_names || user?.role || []);
  const canModify = userRoles.isOrganizationSuperAdmin;

  const handleOptionPress = action => {
    setSelectedAction(action);
    setModalVisible(true);
  };

  const handleManual = () => {
    setModalVisible(false);
    navigation.navigate('PlantSelection', {
      nextScreen: 'StackAssetList',
      ...params,
      title: selectedAction.title,
      redirectDetails:
        selectedAction.mode === 'modify'
          ? null
          : {
              redirectTo: 'CheckInOrOut',
              label: selectedAction.label,
            },
      showBack: true,
    });
  };

  const handleQRScan = () => {
    setModalVisible(false);
    navigation.navigate('QRScanner', {
      ...params,
      mode: selectedAction.mode,
    });
  };

  return (
    <ScreenWrapper title="Asset Check In/Out" showMenu={true} scrollable={true}>
      <View style={styles.content}>
        <Text style={styles.subHeader}>
          Select an option to identify the asset
        </Text>

        <ActionCard
          title="Asset Check In"
          description="Return an asset"
          icon={require('../../assets/checkIn.png')}
          color={COLORS.successLight}
          iconColor={COLORS.success}
          onPress={() =>
            handleOptionPress({
              title: 'Check In Asset',
              mode: 'check_in',
              label: 'Check-in',
            })
          }
        />

        <ActionCard
          title="Asset Check Out"
          description="Assign an asset"
          icon={require('../../assets/checkOut.png')}
          color={COLORS.warningLight}
          iconColor={COLORS.warning}
          onPress={() =>
            handleOptionPress({
              title: 'Check Out Asset',
              mode: 'check_out',
              label: 'Check-out',
            })
          }
        />

        {canModify && (
          <ActionCard
            title="Modify Asset"
            description="Update asset details"
            icon={require('../../assets/modifyAsset.png')}
            color={COLORS.infoLight}
            iconColor={COLORS.info}
            onPress={() =>
              handleOptionPress({
                title: 'Modify Asset',
                mode: 'modify',
                label: 'Modify',
              })
            }
          />
        )}
      </View>

      {/* Mode Selection Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Method</Text>

            <TouchableOpacity style={styles.modalOption} onPress={handleManual}>
              <View
                style={[styles.miniFab, { backgroundColor: COLORS.primary }]}
              >
                <Icon name="list" size={24} color="white" />
              </View>
              <Text style={styles.modalOptionText}>Manual Selection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleQRScan}>
              <View
                style={[styles.miniFab, { backgroundColor: COLORS.secondary }]}
              >
                <Icon name="camera" size={24} color="white" />
              </View>
              <Text style={styles.modalOptionText}>QR Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.l, justifyContent: 'center', flex: 1 },
  subHeader: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    marginTop: SPACING.m,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.l,
    paddingBottom: SPACING.xl + 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.l,
    textAlign: 'center',
    color: COLORS.text,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gradients.background[0],
    marginBottom: 8,
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    marginTop: SPACING.m,
    alignSelf: 'center',
    padding: 12,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckInOutScreen;
