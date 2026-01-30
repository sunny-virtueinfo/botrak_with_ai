import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userSession = await AsyncStorage.getItem('user_session');

        if (userSession) {
          const userData = JSON.parse(userSession);
          if (userData.role_names && typeof userData.role_names === 'string') {
            try {
              userData.role_names = JSON.parse(userData.role_names);
            } catch (e) {
              userData.role_names = [];
            }
          }
          setUser(userData);
          if (userData.token) {
            client.defaults.headers.token = userData.token;

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

  const validatePlan = async (currentOrgId, userData) => {
    try {
      const response = await client.get(API_ENDPOINTS.MY_ORGANIZATIONS);

      if (
        response.data &&
        response.data.my_organizations &&
        response.data.my_organizations.length > 0
      ) {
        const orgs = response.data.my_organizations;

        const currentOrg = orgs.find(o => o.organization_id == currentOrgId);
        let isCurrentPlanActive = false;

        if (currentOrg) {
          if (currentOrg.hasOwnProperty('is_plan_active')) {
            isCurrentPlanActive =
              currentOrg.is_plan_active === true ||
              currentOrg.is_plan_active === 1;
          } else {
            isCurrentPlanActive = true;
          }
        } else {
        }

        if (isCurrentPlanActive) {
          if (
            currentOrg.organization_name &&
            userData.organization_name !== currentOrg.organization_name
          ) {
            const updatedWithNames = {
              ...userData,
              organization_name: currentOrg.organization_name,
            };
            setUser(updatedWithNames);
            AsyncStorage.setItem(
              'user_session',
              JSON.stringify(updatedWithNames),
            ).catch(e => console.error(e));
          } else {
            console.log('Names match or server name missing.');
          }
          return;
        }

        const activeOrg = orgs.find(
          o => o.is_plan_active === true || o.is_plan_active === 1,
        );

        if (activeOrg) {
          const updatedUser = {
            ...userData,
            organization_id: activeOrg.organization_id,
            role: activeOrg.role,
            organization_name: activeOrg.organization_name,
          };

          setUser(updatedUser);

          try {
            await AsyncStorage.setItem(
              'user_session',
              JSON.stringify(updatedUser),
            );

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
          await logout();
        }
      } else {
        await logout();
      }
    } catch (e) {
      console.log('Plan Validation Failed', e);
      if (e.response && e.response.status === 401) {
        await logout();
      }
    }
  };

  const login = async (userData, token) => {
    const userToSave = { ...userData, token };
    setUser(userToSave);

    client.defaults.headers.token = token;

    // Validate plan immediately to ensure org name is up to date
    await validatePlan(userData.organization_id, userToSave);

    try {
      await AsyncStorage.setItem('user_session', JSON.stringify(userToSave));
    } catch (e) {
      console.error('Login Storage Error', e);
    }
  };

  const logout = async () => {
    setUser(null);
    delete client.defaults.headers.token;

    try {
      await AsyncStorage.removeItem('user_session');
      await AsyncStorage.removeItem('active_org');
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
