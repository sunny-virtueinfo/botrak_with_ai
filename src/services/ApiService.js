import client from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export const useApiService = () => {
  const { user } = useAuth();
  const activeOrgId = user?.recent_organization_id;
  const login = async (email, password) => {
    return client.post(API_ENDPOINTS.LOGIN, {
      from_mobile: true,
      user: {
        email,
        password,
      },
    });
  };

  const forgotPassword = async email => {
    return client.post(API_ENDPOINTS.FORGOT_PASSWORD, {
      user: { email },
    });
  };

  const logout = async () => {
    return client.post(
      API_ENDPOINTS.LOGOUT,
      {},
      { headers: { token: user?.token } },
    );
  };

  // Organization
  const getMyOrganizations = async () => {
    return client.get(API_ENDPOINTS.MY_ORGANIZATIONS, {
      headers: { token: user?.token },
    });
  };

  const switchOrganization = async orgId => {
    return client.get(API_ENDPOINTS.SWITCH_ORGANIZATION(orgId || activeOrgId), {
      headers: { token: user?.token },
    });
  };

  // Plants & Locations
  const getPlants = async (orgId = activeOrgId) => {
    return client.get(API_ENDPOINTS.PLANTS(orgId), {
      headers: { token: user?.token },
    });
  };

  const getLocations = async (orgId = activeOrgId, plantId) => {
    return client.get(API_ENDPOINTS.LOCATIONS(orgId, plantId), {
      headers: { token: user?.token },
    });
  };

  // Assets
  const searchAssets = async (orgId = activeOrgId, params) => {
    return client.get(API_ENDPOINTS.SEARCH_OBJECT(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const getCategoriesByLocation = async (
    orgId = activeOrgId,
    plantId,
    locationId,
  ) => {
    const params = {
      organization_asset: JSON.stringify({
        plant_id: plantId,
        location_id: locationId,
      }),
    };
    return client.get(API_ENDPOINTS.ASSET_CATEGORIES_LOCATION(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const getCategoriesByPlant = async (orgId = activeOrgId, params) => {
    // Wrapper for ASSET_CATEGORIES_PLANT endpoint
    // Params should typically include 'organization_asset' stringified
    return client.get(API_ENDPOINTS.ASSET_CATEGORIES_PLANT(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const filterAssetsByType = async (orgId = activeOrgId, params) => {
    return client.get(API_ENDPOINTS.FILTER_BY_ASSET_TYPE(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const getManualAudit = async (orgId = activeOrgId, params) => {
    // Construct query parameters manually to avoid sending "undefined" strings

    const requestParams = {
      organization_asset: JSON.stringify(params.organization_asset || {}),
      from_mobile: true,
    };

    if (params.audit_id) {
      requestParams.audit_id = params.audit_id;
    }

    if (params.page) {
      requestParams.page = params.page;
    }

    if (params.q !== undefined && params.q !== null && params.q !== '') {
      requestParams.q = JSON.stringify(params.q);
    }

    return client.get(API_ENDPOINTS.FILTER_BY_ASSET_TYPE(orgId), {
      params: requestParams,
      headers: { token: user?.token },
    });
  };

  // Audit
  const getAudits = async (orgId = activeOrgId, params = {}) => {
    const { skip_audit_filter, ...otherParams } = params;
    const requestParams = { from_mobile: true };

    if (!skip_audit_filter) {
      // Default behavior: create 'audit' JSON param with organization_id
      requestParams.audit = JSON.stringify({
        organization_id: orgId,
        ...otherParams,
      });
    } else {
      // If skipping filter, use other params directly if any
      Object.assign(requestParams, otherParams);
    }

    return client.get(API_ENDPOINTS.AUDITS(orgId), {
      params: requestParams,
      headers: { token: user?.token },
    });
  };

  const submitAuditEntry = async (orgId = activeOrgId, auditId, assetsData) => {
    // assetsData structure: [{ id: assetId, status: '...', notes: '...' }]
    return client.put(
      API_ENDPOINTS.UPDATE_BY_AUDIT(orgId),
      {
        audit_id: auditId,
        assets: assetsData,
      },
      { headers: { token: user?.token } },
    );
  };

  const getAuditReports = async (orgId = activeOrgId, auditId, params = {}) => {
    return client.get(API_ENDPOINTS.AUDIT_REPORTS(orgId, auditId), {
      params,
      headers: { token: user?.token },
    });
  };

  const addNewAuditAssets = async (orgId = activeOrgId, auditId, data) => {
    return client.post(API_ENDPOINTS.NEW_AUDIT_ASSETS(orgId, auditId), data, {
      headers: { token: user?.token },
    });
  };

  // Asset Register Operations
  const getAssetRegisters = async (orgId = activeOrgId, params = {}) => {
    return client.get(API_ENDPOINTS.ASSET_REGISTER(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const checkInAsset = async (
    orgId = activeOrgId,
    registerId,
    assetId,
    data,
  ) => {
    return client.post(
      API_ENDPOINTS.CHECKIN_ASSET(orgId, registerId, assetId),
      data,
      {
        headers: { token: user?.token },
      },
    );
  };

  const checkOutAsset = async (
    orgId = activeOrgId,
    registerId,
    assetId,
    data,
  ) => {
    return client.post(
      API_ENDPOINTS.CHECKOUT_ASSET(orgId, registerId, assetId),
      data,
      {
        headers: { token: user?.token },
      },
    );
  };

  // Organization Assets Operations
  const updateAndDestroyAssets = async (orgId = activeOrgId, data) => {
    return client.post(API_ENDPOINTS.UPDATE_AND_DESTROY(orgId), data, {
      headers: { token: user?.token },
    });
  };

  const scanAssetSuccessOnly = async (orgId = activeOrgId, qrCode) => {
    const params = {
      organization_asset: JSON.stringify({
        qr_code: qrCode,
        organization_id: orgId,
      }),
      from_mobile: true,
    };
    return client.get(API_ENDPOINTS.SCAN_OBJECT_SUCCESS(orgId), {
      params,
      headers: { token: user?.token },
    });
  };

  const getAssetAuditLogs = async (orgId = activeOrgId, assetId) => {
    return client.get(API_ENDPOINTS.AUDIT_LOGS(orgId, assetId), {
      headers: { token: user?.token },
    });
  };

  const updateAsset = async (orgId = activeOrgId, data, params = {}) => {
    return client.put(API_ENDPOINTS.ORGANIZATION_ASSETS(orgId), data, {
      params,
      headers: {
        token: user?.token,
      },
    });
  };

  const deleteAsset = async (orgId = activeOrgId, data, params = {}) => {
    return client.put(API_ENDPOINTS.UPDATE_AND_DESTROY(orgId), data, {
      params,
      headers: { token: user?.token },
    });
  };

  // Billing
  const getCurrentPlan = async (orgId = activeOrgId) => {
    return client.get(API_ENDPOINTS.USER_PLAN(orgId), {
      headers: { token: user?.token },
    });
  };

  const cancelCurrentPlan = async (orgId = activeOrgId, params = {}) => {
    return client.post(API_ENDPOINTS.CANCEL_PLAN(orgId), params, {
      headers: { token: user?.token },
    });
  };

  const getInvoices = async (orgId = activeOrgId) => {
    return client.get(API_ENDPOINTS.INVOICE(orgId), {
      headers: { token: user?.token },
    });
  };

  const markInvoicePaid = async (orgId = activeOrgId, data) => {
    // data: { invoice_id, transaction_number }
    return client.post(API_ENDPOINTS.PAY_INVOICE(orgId), data, {
      headers: { token: user?.token },
    });
  };

  // Requests
  const getPendingRequests = async (orgId = activeOrgId) => {
    return client.get(API_ENDPOINTS.PENDING_REQUESTS(orgId), {
      headers: { token: user?.token },
    });
  };

  const createRequest = async (orgId = activeOrgId, data) => {
    return client.post(API_ENDPOINTS.REQUESTS(orgId), data, {
      headers: { token: user?.token },
    });
  };

  const approveRequest = async (orgId = activeOrgId, requestId) => {
    return client.post(
      API_ENDPOINTS.APPROVE_REQUEST(orgId, requestId),
      {},
      { headers: { token: user?.token } },
    );
  };

  const rejectRequest = async (orgId = activeOrgId, requestId, data = {}) => {
    return client.post(API_ENDPOINTS.REJECT_REQUEST(orgId, requestId), data, {
      headers: { token: user?.token },
    });
  };

  // Reminders
  const getReminders = async (orgId = activeOrgId) => {
    return client.get(API_ENDPOINTS.REMINDERS(orgId), {
      headers: { token: user?.token },
    });
  };

  const createReminder = async (orgId = activeOrgId, data) => {
    return client.put(API_ENDPOINTS.ORGANIZATION_ASSETS(orgId), data, {
      headers: { token: user?.token },
    });
  };

  // Assignments
  /* Assignment & Employee Reference Implementations */
  const getEmployees = async (orgId = activeOrgId, params = {}) => {
    // Switching to standard axios params.
    const requestParams = {
      from_mobile: true,
      page: params.page || 1,
    };

    // Similar to getManualAudit, backend might expect JSON stringified q
    if (params.q !== undefined && params.q !== null && params.q !== '') {
      // If q is just a string (search text), wrap it in a Ransack matcher
      // Using 'search_cont' as requested by user
      const qObject =
        typeof params.q === 'string' ? { search_cont: params.q } : params.q;

      requestParams.q = JSON.stringify(qObject);
    }

    return client.get(API_ENDPOINTS.GET_USERS(orgId), {
      params: requestParams,
      headers: { token: user?.token },
    });
  };

  const getAssignmentDetails = async (orgId = activeOrgId, params = {}) => {
    const from_mobile = true;
    let queryString = `from_mobile=${from_mobile}`;

    // Backend likely expects organization_asset param even if empty
    const orgAsset = params.organization_asset || {};
    queryString += `&organization_asset=${JSON.stringify(orgAsset)}`;

    return client.get(
      `${API_ENDPOINTS.ASSIGNMENT_DETAILS(orgId)}?${queryString}`,
      {
        headers: { token: user?.token },
      },
    );
  };

  const getAssetDetailsThroughQRCode = async (
    orgId = activeOrgId,
    organization_asset,
  ) => {
    const orgAssetStr = JSON.stringify(organization_asset);
    const queryString = `organization_asset=${orgAssetStr}&from_mobile=true`;
    return client.get(
      `${API_ENDPOINTS.ASSIGNMENT_DETAILS(orgId)}?${queryString}`,
      {
        headers: { token: user?.token },
      },
    );
  };

  const assignAsset = async (orgId = activeOrgId, data) => {
    // User ref: HttpClient.post(ASSIGN_ASSET_API, body, undefined, token);
    return client.post(API_ENDPOINTS.ASSIGN_ASSET(orgId), data, {
      headers: { token: user?.token },
    });
  };

  const getAssetListForAssignment = async (
    orgId = activeOrgId,
    registerId,
    params = {},
  ) => {
    return client.get(API_ENDPOINTS.ASSET_LIST(orgId, registerId), {
      params,
      headers: { token: user?.token },
    });
  };

  const unassignAsset = async (orgId = activeOrgId, data) => {
    // User ref: HttpClient.post(UNASSIGN_ASSET_API, body, undefined, token);
    return client.post(API_ENDPOINTS.UNASSIGN_ASSET(orgId), data, {
      headers: { token: user?.token },
    });
  };

  const submitAuditLog = async (
    orgId = activeOrgId,
    auditId,
    assetId,
    data,
  ) => {
    // URL: /:orgId/organization_assets/:assetId/audit_logs
    return client.put(API_ENDPOINTS.AUDIT_LOGS(orgId, assetId), data, {
      headers: { token: user?.token },
    });
  };

  return {
    login,
    forgotPassword,
    logout,
    getMyOrganizations,
    switchOrganization,
    getEmployees,
    getPlants,
    getLocations,
    searchAssets,
    getCategoriesByLocation,
    getCategoriesByPlant,
    getAudits,
    submitAuditEntry,
    submitAuditLog,
    filterAssetsByType,
    getAuditReports,
    addNewAuditAssets,
    getAssetRegisters,
    checkInAsset,
    checkOutAsset,
    updateAndDestroyAssets,
    scanAssetSuccessOnly,
    getAssetAuditLogs,
    updateAsset,
    deleteAsset,
    getCurrentPlan,
    cancelCurrentPlan,
    getInvoices,
    markInvoicePaid,
    getPendingRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    getReminders,
    getAssignmentDetails,
    assignAsset,
    unassignAsset,
    getManualAudit,
    createReminder,
    getAssetDetailsThroughQRCode,
    getAssetListForAssignment,
  };
};
