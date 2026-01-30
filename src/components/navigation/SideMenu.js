import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { getMenuItems, ROLES } from '../../utils/RoleManager';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrganizationSwitchModal from '../common/OrganizationSwitchModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';

const SideMenu = ({ navigation, state }) => {
  const { user, logout, updateUserOrg } = useAuth();
  const [isOrgModalVisible, setOrgModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [approvalCount, setApprovalCount] = useState(0);
  const [activeOrgName, setActiveOrgName] = useState('');
  const { showToast } = useToast();
  const api = useApiService();

  useEffect(() => {
    const loadOrgName = async () => {
      try {
        if (user?.organization_name) {
          setActiveOrgName(user.organization_name);
        } else {
          const storedOrg = await AsyncStorage.getItem('active_org');
          if (storedOrg) {
            const parsed = JSON.parse(storedOrg);
            setActiveOrgName(parsed.organization_name);
          }
        }

        if (user?.recent_organization_id) {
          const res = await api.getPendingRequests(user.recent_organization_id);
          const count =
            res?.data?.count ??
            (Array.isArray(res?.data)
              ? res.data.length
              : Array.isArray(res?.data?.data)
              ? res.data.data.length
              : 0);
          setApprovalCount(count);
        }
      } catch (e) {
        console.error('Failed to load active org name or count', e);
      }
    };
    loadOrgName();
  }, [user, isOrgModalVisible]);

  const activeRoles =
    user?.role_names && user.role_names.length > 0
      ? user.role_names
      : [user?.role || ROLES.EMPLOYEE];

  const menuItems = getMenuItems(activeRoles);
  const activeRoute = state?.routes?.[state?.index]?.name || '';

  const isActive = route => activeRoute === route;

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const handleNavigation = route => {
    if (route === 'MyOrganizations') {
      setOrgModalVisible(true);
    } else if (route === 'AssetAssignment') {
      setAssignmentModalVisible(true);
    } else {
      navigation.navigate(route);
    }
  };

  const handleManualSelect = () => {
    setAssignmentModalVisible(false);
    const orgId = user?.organization_id;
    navigation.navigate('AssetRegisterSelection', { organizationId: orgId });
  };

  const handleQRSelect = () => {
    setAssignmentModalVisible(false);
    const orgId = user?.organization_id;
    navigation.navigate('QRScanner', {
      isForAssignment: true,
      organizationId: orgId,
    });
  };

  const handleSwitchOrg = async org => {
    setOrgModalVisible(false);

    const extractedRole =
      org.role ||
      org.role_name ||
      (org.role_names && org.role_names.length > 0 ? org.role_names[0] : null);

    const newOrg = {
      organization_id: org.organization_id,
      organization_name: org.organization_name || org.name,
      role: extractedRole,
    };
    setActiveOrgName(newOrg.organization_name);

    try {
      await AsyncStorage.setItem('active_org', JSON.stringify(newOrg));
      if (updateUserOrg) {
        await updateUserOrg(
          newOrg.organization_id,
          newOrg.role,
          newOrg.organization_name,
        );
      }
    } catch (e) {
      console.error('Failed to switch org', e);
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Dashboard',
          params: {
            organizationId: newOrg.organization_id,
            orgName: newOrg.organization_name,
            organization_name: newOrg.organization_name,
            role: newOrg.role || 'employee',
          },
        },
      ],
    });
    showToast('Organization switched successfully', 'success');
  };

  return (
    <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.container}>
      <OrganizationSwitchModal
        visible={isOrgModalVisible}
        onClose={() => setOrgModalVisible(false)}
        onSelect={handleSwitchOrg}
      />

      {/* Assignment Modal */}
      <Modal
        visible={assignmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignmentModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setAssignmentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Assignment Mode</Text>
                  <TouchableOpacity
                    onPress={() => setAssignmentModalVisible(false)}
                  >
                    <Feather name="x" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Choose how to assign assets
                </Text>

                <Button
                  title="Manual Selection"
                  icon="list"
                  onPress={handleManualSelect}
                  style={{ marginBottom: 12, backgroundColor: COLORS.primary }}
                />

                <Button
                  title="Scan QR Code"
                  icon="maximize"
                  onPress={handleQRSelect}
                  style={{ backgroundColor: COLORS.secondary }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.logoutIconWrapper}>
                  <Feather name="log-out" size={32} color={COLORS.error} />
                </View>
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                  Log Out
                </Text>
                <Text style={styles.modalSubtitleCentered}>
                  Are you sure you want to sign out?
                </Text>

                <View style={styles.modalActionRow}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      onPress={() => setLogoutModalVisible(false)}
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.surfaceHighlight,
                      }}
                      textStyle={{ color: COLORS.text }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Button
                      title="Log Out"
                      variant="danger"
                      onPress={confirmLogout}
                      style={{ width: '100%' }}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        {/* User Profile Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </LinearGradient>

          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'User Name'}
            </Text>

            {activeOrgName ? (
              <Text style={styles.orgName} numberOfLines={1}>
                {activeOrgName}
              </Text>
            ) : null}

            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'user@botrak.com'}
            </Text>
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {(activeRoles || [])
                .map(r => (r ? r.replace(/_/g, ' ').toUpperCase() : ''))
                .join(', ')
                .slice(0, 3)}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: SPACING.m }}
          >
            {(menuItems || []).map(item => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, active && styles.activeMenuItem]}
                  onPress={() => handleNavigation(item.route)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      active && { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={active ? '#fff' : COLORS.textLight}
                    />
                  </View>
                  <Text
                    style={[styles.menuLabel, active && styles.activeMenuLabel]}
                  >
                    {item.label}
                  </Text>

                  {/* Approval Count Badge */}
                  {item.route === 'Approvals' && approvalCount > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {approvalCount > 99 ? '99+' : approvalCount}
                      </Text>
                    </View>
                  )}

                  {active && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color={COLORS.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    padding: SPACING.l,
    paddingTop: Platform.OS === 'ios' ? SPACING.l : SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  avatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  orgName: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    position: 'absolute',
    top: 0,
    right: 20,
    ...SHADOWS.soft,
  },
  roleText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: SPACING.m,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeMenuItem: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15,
    color: COLORS.textLight,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  activeMenuLabel: {
    color: 'white',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  footer: {
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.errorLight,
    borderRadius: 16,
    gap: 12,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 16,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate 900 with opacity
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...SHADOWS.hard,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
  },
  modalSubtitleCentered: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  logoutIconWrapper: {
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.errorLight,
    padding: 16,
    borderRadius: 50,
  },
  modalActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  badgeContainer: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
    marginRight: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default SideMenu;
