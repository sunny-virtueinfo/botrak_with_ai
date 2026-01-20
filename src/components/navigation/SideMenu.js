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
          // Fallback for legacy session or initial load
          const storedOrg = await AsyncStorage.getItem('active_org');
          if (storedOrg) {
            const parsed = JSON.parse(storedOrg);
            setActiveOrgName(parsed.organization_name);
          }
        }

        // Fetch Approval Count
        if (user?.recent_organization_id) {
          const res = await api.getPendingRequests(user.recent_organization_id);
          // Check for count directly or array length
          const count = res?.data?.count ?? (Array.isArray(res?.data) ? res.data.length : (Array.isArray(res?.data?.data) ? res.data.data.length : 0));
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
      organization_name: org.organization_name || org.name, // Prioritize organization_name
      role: extractedRole,
    };
    // Update local state immediately
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
            organization_name: newOrg.organization_name, // Pass both for safety if other screens use different keys
            role: newOrg.role || 'employee',
          },
        },
      ],
    });
    showToast('Organization switched successfully', 'success');
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.container}>
      <OrganizationSwitchModal
        visible={isOrgModalVisible}
        onClose={() => setOrgModalVisible(false)}
        onSelect={handleSwitchOrg}
      />

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
                  <View style={{ width: 24 }} />
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

                <TouchableOpacity
                  style={styles.modeBtn}
                  onPress={handleManualSelect}
                >
                  <MaterialCommunityIcons
                    name="format-list-bulleted"
                    size={22}
                    color="white"
                  />
                  <Text style={styles.modeBtnText}>Manual Selection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    { backgroundColor: COLORS.secondary },
                  ]}
                  onPress={handleQRSelect}
                >
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={22}
                    color="white"
                  />
                  <Text style={styles.modeBtnText}>Scan QR Code</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout Confirmation Modal */}
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
                <View
                  style={[
                    styles.logoutIconWrapper,
                    {
                      marginBottom: 16,
                      backgroundColor: '#FEE2E2',
                      borderRadius: 50,
                      padding: 16,
                    },
                  ]}
                >
                  <Feather name="log-out" size={32} color={COLORS.error} />
                </View>
                <Text style={styles.modalTitle}>Log Out</Text>
                <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>
                  Are you sure you want to sign out of your account?
                </Text>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      { flex: 1, backgroundColor: '#F1F5F9', elevation: 0 },
                    ]}
                    onPress={() => setLogoutModalVisible(false)}
                  >
                    <Text style={[styles.modeBtnText, { color: COLORS.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      { flex: 1, backgroundColor: COLORS.error },
                    ]}
                    onPress={confirmLogout}
                  >
                    <Text style={styles.modeBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        {/* Modern Floating Header Profile */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.primary, '#6366F1']}
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
                {/* <Feather name="briefcase" size={12} color={COLORS.textLight} />  */}
                {activeOrgName}
              </Text>
            ) : null}

            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'user@botrak.com'}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {(activeRoles || [])
                  .map(r => (r ? r.replace(/_/g, ' ').toUpperCase() : ''))
                  .join(', ')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
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
                      active && { backgroundColor: '#fff' },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={active ? COLORS.primary : COLORS.textLight}
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

          {/* Floating Logout */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.logoutIconWrapper}>
                <Feather name="log-out" size={18} color={COLORS.error} />
              </View>
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
    width: 60,
    height: 60,
    borderRadius: 20, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
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
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  orgName: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.9,
  },
  roleBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30, // Create floating panel effect
    ...SHADOWS.medium,
    paddingTop: 20,
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
    borderRadius: 16,
    marginBottom: 6,
  },
  activeMenuItem: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
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
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
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
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  logoutIconWrapper: {
    marginRight: 12,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal (kept similar but cleaned up)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 0,
    textAlign: 'center',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSubtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 24 },
  modeBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
    ...SHADOWS.soft,
  },
  modeBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  badgeContainer: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SideMenu;
