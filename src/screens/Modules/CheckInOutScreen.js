import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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

  const ActionItem = ({ title, description, image, color, onPress, style }) => (
    <Card
      variant="elevated"
      style={[
        styles.actionCard,
        { borderLeftColor: color, borderLeftWidth: 4 },
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionContent}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Image
            source={image}
            style={styles.actionImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDesc}>{description}</Text>
        </View>
        <Feather name="chevron-right" size={24} color={COLORS.textLight} />
      </View>
    </Card>
  );

  return (
    <ScreenWrapper title="Asset Check In/Out" showMenu={true} scrollable={true}>
      <View style={styles.content}>
        <Text style={styles.subHeader}>Select an action to proceed</Text>

        <View style={styles.cardsContainer}>
          <ActionItem
            title="Asset Check In"
            description="Return an asset to inventory"
            image={require('../../assets/checkIn.png')}
            color={COLORS.success}
            onPress={() =>
              handleOptionPress({
                title: 'Check In Asset',
                mode: 'check_in',
                label: 'Check-in',
              })
            }
          />

          <ActionItem
            title="Asset Check Out"
            description="Assign an asset to a user/location"
            image={require('../../assets/checkOut.png')}
            color={COLORS.warning}
            onPress={() =>
              handleOptionPress({
                title: 'Check Out Asset',
                mode: 'check_out',
                label: 'Check-out',
              })
            }
            style={{ marginTop: 20 }}
          />

          {canModify && (
            <ActionItem
              title="Modify Asset"
              description="Update asset details and status"
              image={require('../../assets/modifyAsset.png')}
              color={COLORS.info}
              onPress={() =>
                handleOptionPress({
                  title: 'Modify Asset',
                  mode: 'modify',
                  label: 'Modify',
                })
              }
              style={{ marginTop: 20 }}
            />
          )}
        </View>
      </View>

      {/* Mode Selection Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Method</Text>

            <Button
              title="Manual Selection"
              icon="list"
              variant="primary"
              onPress={handleManual}
              style={{ marginBottom: 16 }}
            />

            <Button
              title="Scan QR Code"
              icon="maximize"
              variant="secondary"
              onPress={handleQRScan}
              style={{ marginBottom: 24 }}
            />

            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            />
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.l,
    flex: 1,
    justifyContent: 'center', // Center content vertically
  },
  cardsContainer: {
    justifyContent: 'center',
    paddingBottom: 40, // Add some bottom padding for visual balance
  },
  subHeader: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  actionCard: {
    padding: SPACING.l, // Larger padding for premium feel
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  actionImage: {
    width: 32,
    height: 32,
    tintColor: COLORS.text,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  actionDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.l,
    paddingBottom: SPACING.xl + 20,
    ...SHADOWS.hard,
  },
  modalHandle: {
    width: 50,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.xl,
    textAlign: 'center',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    borderRadius: 16,
  },
});

export default CheckInOutScreen;
