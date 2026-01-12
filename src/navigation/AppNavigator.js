import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../components/common/Loader';
import { useApiService } from '../services/ApiService'; // Add import
import LoginScreen from '../screens/Auth/LoginScreen';
import AssetListScreen from '../screens/Asset/AssetListScreen'; // Reusing as 'Assets' module
import QRScannerScreen from '../screens/Asset/QRScannerScreen';
import AssetDetailScreen from '../screens/Asset/AssetDetailScreen';
import UpdateAssetScreen from '../screens/Asset/UpdateAssetScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen'; // Added import
import {
  CheckInOutScreen,
  AuditListScreen,
  AuditReportsScreen,
  AuditReportDetailsScreen,
  RemindersScreen,
  ApprovalsScreen,
  AssetAssignmentScreen,
  AssetAssignmentDetailScreen,
  InvoicesScreen,
  CurrentPlanScreen,
  AuditLocationsScreen,
  AuditCategoriesScreen,
  AuditAssetListScreen,
} from '../screens/Modules/ModuleScreens';

import SideMenu from '../components/navigation/SideMenu';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = ({ route }) => {
  const { user } = useAuth();

  // Robustly determine role: User Context -> Param -> Default
  let effectiveRole = null;

  // 1. Priority: User Object Role Names (as requested)
  if (
    user &&
    user.role_names &&
    Array.isArray(user.role_names) &&
    user.role_names.length > 0
  ) {
    effectiveRole = user.role_names[0];
  }

  // // 2. Fallback: Param Role
  // if (!effectiveRole) {
  //   effectiveRole = route.params.role;
  // }

  // 3. Last Resort: User.role
  if (!effectiveRole && user && user.role) {
    effectiveRole = user.role;
  }
  effectiveRole = effectiveRole || 'employee';

  // Helper to pass params to all screens
  const commonOptions = {
    initialParams: { ...route.params },
  };
  // Determine permissions based on effective role
  // We need to fetch the permissions object for the effective role (or all user roles)
  // Since effectiveRole is singular here (for SideMenu prop), we might want to check the full user roles for routing too.

  const {
    getUserRolesObject,
    getScreenAccess,
  } = require('../utils/RoleManager');

  // Use user.role_names if available for accurate permission check, otherwise effectiveRole
  const routeRoles =
    user?.role_names && user.role_names.length > 0
      ? user.role_names
      : [effectiveRole];
  const userRolesObj = getUserRolesObject(routeRoles);
  const screenAccess = getScreenAccess(userRolesObj);

  // Determine initial screen based on ACCESS, not just role name
  // Priority: CheckInOut -> AuditList -> AssetList
  let initialRoute = 'CheckInOut';

  if (screenAccess.AssetCheckInOutScreen) {
    initialRoute = 'CheckInOut';
  } else if (screenAccess.AuditScreen) {
    initialRoute = 'AuditList';
  }

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      backBehavior="initialRoute"
      drawerContent={props => <SideMenu {...props} role={effectiveRole} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="CheckInOut"
        component={CheckInOutScreen}
        options={{ title: 'Check In/Out' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="AuditList"
        component={AuditListScreen}
        options={{ title: 'Audits' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="AuditReports"
        component={AuditReportsScreen}
        options={{ title: 'Reports' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ title: 'Reminders' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{ title: 'Approvals' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="AssetAssignment"
        component={AssetAssignmentScreen}
        options={{ title: 'Assignment' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ title: 'Invoices' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="CurrentPlan"
        component={CurrentPlanScreen}
        options={{ title: 'Current Plan' }}
        {...commonOptions}
      />
      <Drawer.Screen
        name="AssetRegisterSelection"
        component={
          require('../screens/Modules/AssetRegisterSelectionScreen').default
        }
        options={{ title: 'Select Register' }}
        {...commonOptions}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading, updateUserOrg } = useAuth();
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Dashboard');
  const [initialParams, setInitialParams] = React.useState({});
  const api = useApiService();

  React.useEffect(() => {
    const prepareNavigation = async () => {
      if (user) {
        try {
          // 1. Try Storage
          const storedOrg = await AsyncStorage.getItem('active_org');

          if (storedOrg) {
            const defaultOrg = JSON.parse(storedOrg);
            // Sync with AuthContext to ensure UI consistency
            if (updateUserOrg && user) {
              if (
                user.organization_id !== defaultOrg.organization_id ||
                user.role !== defaultOrg.role
              ) {
                await updateUserOrg(
                  defaultOrg.organization_id,
                  defaultOrg.role,
                );
              }
            }
            setupDashboard(defaultOrg);
          } else {
            // 2. Fallback: Fetch from API and Auto-Select First
            try {
              const response = await api.getMyOrganizations();
              if (
                response.data &&
                response.data.my_organizations &&
                response.data.my_organizations.length > 0
              ) {
                // Find first org with active plan
                let firstOrgRaw = response.data.my_organizations.find(
                  org =>
                    org.is_plan_active === true || org.is_plan_active === 1,
                );

                // Fallback to first org if no active plan found (or let it fail if strict?)
                if (!firstOrgRaw) {
                  firstOrgRaw = response.data.my_organizations[0];
                }
                // ...
                // Standardize to organization_id
                const firstOrg = {
                  organization_id: firstOrgRaw.organization_id,
                  name: firstOrgRaw.organization_name,
                  role: firstOrgRaw.role,
                };
                // Save for future
                await AsyncStorage.setItem(
                  'active_org',
                  JSON.stringify(firstOrg),
                );

                // Sync with AuthContext
                if (updateUserOrg && user) {
                  if (
                    user.organization_id !== firstOrg.organization_id ||
                    user.role !== firstOrg.role
                  ) {
                    await updateUserOrg(
                      firstOrg.organization_id,
                      firstOrg.role,
                    );
                  }
                }

                setupDashboard(firstOrg);
              } else {
                // No orgs? Stay on MyOrganizations or go to Dashboard empty?
                // Default state is MyOrganizations, so do nothing.
              }
            } catch (apiErr) {
              console.error('Failed to auto-fetch orgs', apiErr);
            }
          }
        } catch (e) {
          console.error('Failed to load default org', e);
        }
      }
      setIsReady(true);
    };

    const setupDashboard = org => {
      // Check for global role from user object ONLY if org.role is missing
      let effectiveRole = org.role;

      if (!effectiveRole && user.role_names && Array.isArray(user.role_names)) {
        if (user.role_names.length > 0) {
          effectiveRole = user.role_names[0];
        }
      }

      // Ensure we don't have empty role
      if (!effectiveRole && user.role) {
        effectiveRole = user.role;
      }

      setInitialRoute('Dashboard');
      setInitialParams({
        organizationId: org.organization_id, // Support current state but prefer organization_id
        orgName: org.name,
        role: effectiveRole || 'employee',
      });
    };

    if (!loading) {
      prepareNavigation();
    }
  }, [user, loading]);

  if (loading || (user && !isReady)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader visible={true} size="large" overlay={false} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? initialRoute : 'Login'}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DrawerNavigator}
              initialParams={initialParams}
            />
            <Stack.Screen
              name="StackAssetList"
              component={AssetListScreen}
              options={{ headerShown: false, title: 'Asset List' }}
            />
            <Stack.Screen
              name="AssetDetail"
              component={AssetDetailScreen}
              options={{ headerShown: false, title: 'Asset Details' }}
            />
            <Stack.Screen
              name="UpdateAsset"
              component={UpdateAssetScreen}
              options={{ headerShown: false, title: 'Update Asset' }}
            />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen
              name="PlantSelection"
              component={
                require('../screens/Asset/PlantSelectionScreen').default
              }
              options={{ headerShown: false, title: 'Select Plant' }}
            />

            {/* Advanced Audit Flow */}
            <Stack.Screen
              name="AuditLocations"
              component={AuditLocationsScreen}
              options={{ headerShown: false, title: 'Audit Locations' }}
            />
            <Stack.Screen
              name="AuditCategories"
              component={AuditCategoriesScreen}
              options={{ headerShown: false, title: 'Categories' }}
            />
            <Stack.Screen
              name="AuditAssetList"
              component={AuditAssetListScreen}
              options={{ headerShown: false, title: 'Audit Assets' }}
            />
            <Stack.Screen
              name="AddNewAsset"
              component={require('../screens/Audit/AddNewAssetScreen').default}
              options={{ headerShown: false, title: 'New Asset' }}
            />
            <Stack.Screen
              name="AuditReportDetails"
              component={AuditReportDetailsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddReminder"
              component={
                require('../screens/Modules/AddReminderScreen').default
              }
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CheckInOrOut"
              component={
                require('../screens/Modules/CheckInOrOutScreen').default
              }
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EmployeeList"
              component={
                require('../screens/Modules/EmployeeListScreen').default
              }
              options={{ headerShown: false, title: 'Select Employee' }}
            />
            <Stack.Screen
              name="AssetAssignmentDetail"
              component={AssetAssignmentDetailScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
