import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Init and restore session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userSession = await AsyncStorage.getItem('user_session');

        if (userSession) {
          const userData = JSON.parse(userSession);
          // Parse role_names if it's a string (legacy check)
          if (userData.role_names && typeof userData.role_names === 'string') {
            try {
              userData.role_names = JSON.parse(userData.role_names);
            } catch (e) {
              userData.role_names = [];
            }
          }
          setUser(userData);
          // Set Axios Header
          if (userData.token) {
            client.defaults.headers.token = userData.token;

            // Validate Plan Status
            await validatePlan(userData.organization_id, userData);
          }
        }
      } catch (e) {
        console.log('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  /*
   * Validates if the user has an active plan.
   * If the current org's plan is expired, it tries to find another org with an active plan.
   * If NO active plan is found across any organization, it logs the user out.
   */
  const validatePlan = async (currentOrgId, userData) => {
    try {
      // We need to fetch organizations to check current status
      // We use client directly to avoid hook restrictions
      const response = await client.get(API_ENDPOINTS.MY_ORGANIZATIONS);

      if (
        response.data &&
        response.data.my_organizations &&
        response.data.my_organizations.length > 0
      ) {
        const orgs = response.data.my_organizations;

        // 1. Check current organization first
        const currentOrg = orgs.find(o => o.organization_id == currentOrgId);
        let isCurrentPlanActive = false;

        if (currentOrg) {
          if (currentOrg.hasOwnProperty('is_plan_active')) {
            isCurrentPlanActive =
              currentOrg.is_plan_active === true ||
              currentOrg.is_plan_active === 1;
          } else {
            // If the key is missing, assume active to avoid lockout errors?
            // Or assume inactive? The prompt says "Check if not have any current plan".
            // Let's assume safe default is true unless server explicitly says false,
            // but usually a flag existence means we should trust it.
            // For now, let's stick to the previous logic default which was 'true' but safer implementation:
            isCurrentPlanActive = true;
          }
        }

        if (isCurrentPlanActive) {
          // All good, stay here.

          // Backfill name if missing (Data Migration)
          if (!userData.organization_name && currentOrg.organization_name) {
            const updatedWithNames = {
              ...userData,
              organization_name: currentOrg.organization_name,
            };
            setUser(updatedWithNames);
            AsyncStorage.setItem(
              'user_session',
              JSON.stringify(updatedWithNames),
            ).catch(e => console.error(e));
          }
          return;
        }

        // 2. Current plan is inactive (or current org not found). Look for ANY other active plan.
        const activeOrg = orgs.find(
          o => o.is_plan_active === true || o.is_plan_active === 1,
        );

        if (activeOrg) {
          const updatedUser = {
            ...userData,
            organization_id: activeOrg.organization_id,
            role: activeOrg.role,
          };

          // Save to State
          setUser(updatedUser);

          // Save to Storage
          try {
            await AsyncStorage.setItem(
              'user_session',
              JSON.stringify(updatedUser),
            );

            // Also update 'active_org' which AppNavigator uses
            const orgToSave = {
              organization_id: activeOrg.organization_id,
              name: activeOrg.organization_name,
              role: activeOrg.role,
            };
            await AsyncStorage.setItem('active_org', JSON.stringify(orgToSave));
          } catch (e) {
            console.error('Auto-switch Org Save Error', e);
          }
        } else {
          // 3. No active plans found anywhere.
          console.log('No active plans found. Auto-logging out.');
          // Ensure we clear everything
          await logout();
        }
      } else {
        // No organizations found at all?
        // This effectively means no plan.
        console.log('No organizations found. Auto-logging out.');
        await logout();
      }
    } catch (e) {
      console.log('Plan Validation Failed', e);
      if (e.response && e.response.status === 401) {
        console.log('Token expired or invalid. Auto-logging out.');
        await logout();
      }
    }
  };

  const login = async (userData, token) => {
    // 1. Save to State
    const userToSave = { ...userData, token };
    setUser(userToSave);

    // Set Header
    client.defaults.headers.token = token;

    // 2. Save to Storage
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(userToSave));
    } catch (e) {
      console.error('Login Storage Error', e);
    }
  };

  const logout = async () => {
    // User requested to skip API logout and just clear local
    // try {
    //   await client.post(API_ENDPOINTS.LOGOUT);
    // } catch (e) {
    //   console.error('Backend Logout Failed', e);
    // }

    setUser(null);
    // Clear Header
    delete client.defaults.headers.token;

    try {
      await AsyncStorage.removeItem('user_session');
      await AsyncStorage.removeItem('active_org'); // Also clear active org
    } catch (e) {
      console.error('Logout Error', e);
    }
  };

  const updateUserOrg = async (newOrgId, newRole, newOrgName) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      organization_id: newOrgId,
      role: newRole || user.role,
      organization_name: newOrgName || user.organization_name,
      // Note: role_names might need update too if backend provides it
    };

    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Update User Org Error', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUserOrg }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
