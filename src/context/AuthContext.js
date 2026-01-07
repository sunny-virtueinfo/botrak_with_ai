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
            validatePlan(userData.organization_id);
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

  const validatePlan = async currentOrgId => {
    try {
      // We need to fetch organizations to check current status
      // We use client directly to avoid hook restrictions
      const response = await client.get(API_ENDPOINTS.MY_ORGANIZATIONS);

      if (response.data && response.data.my_organizations) {
        const currentOrg = response.data.my_organizations.find(
          o => o.organization_id == currentOrgId,
        );

        if (currentOrg) {
          // Check if plan is active
          // Default to true if undefined to avoid accidental lockout
          let isMsgPlanActive = true;

          if (currentOrg.hasOwnProperty('is_plan_active')) {
            isMsgPlanActive =
              currentOrg.is_plan_active === true ||
              currentOrg.is_plan_active === 1;
          }

          if (!isMsgPlanActive) {
            console.log('Current plan expired. Auto-logging out.');
            logout();
          }
        }
      }
    } catch (e) {
      console.log('Plan Validation Failed', e);
    }
  };

  const login = async (userData, token) => {
    // 1. Save to State
    // Ensure role_names is parsed/valid
    /* 
       Note: API usually sends role_names array. 
       If we need to modify userData structure before saving, do it here.
    */
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

  const updateUserOrg = async (newOrgId, newRole) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      organization_id: newOrgId,
      role: newRole || user.role,
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
