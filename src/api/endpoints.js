export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/log_in',
  LOGOUT: '/logout',
  FORGOT_PASSWORD: '/password',

  // Organization
  MY_ORGANIZATIONS: '/users/my_organizations',
  SWITCH_ORGANIZATION: orgId => `/organization/organization_switch/${orgId}`,
  GET_USERS: orgId => `/${orgId}/users`,

  // Plants & Locations
  PLANTS: orgId => `/${orgId}/plants`,
  LOCATIONS: (orgId, plantId) => `/${orgId}/plants/${plantId}/locations`,

  // Asset Register
  ASSET_REGISTER: orgId => `/${orgId}/asset_registers`,
  ASSET_LIST: (orgId, registerId) =>
    `/${orgId}/asset_registers/${registerId}/asset_list`,
  ASSET_DETAIL: (orgId, registerId, assetId) =>
    `/${orgId}/asset_registers/${registerId}/organization_assets/${assetId}`,
  CHECKIN_ASSET: (orgId, registerId, assetId) =>
    `/${orgId}/asset_registers/${registerId}/organization_assets/${assetId}/checkin_asset`,
  CHECKOUT_ASSET: (orgId, registerId, assetId) =>
    `/${orgId}/asset_registers/${registerId}/organization_assets/${assetId}/checkout_asset`,

  // Audit
  AUDITS: orgId => `/${orgId}/audits`,
  AUDIT_REPORTS: (orgId, auditId) =>
    `/${orgId}/audits/${auditId}/audit_reports`,
  NEW_AUDIT_ASSETS: (orgId, auditId) =>
    `/${orgId}/audits/${auditId}/new_assets`,

  // Assignments
  ASSIGN_ASSET: orgId => `/${orgId}/assignments/assign_asset`,
  UNASSIGN_ASSET: orgId => `/${orgId}/assignments/unassign_asset`,
  ASSIGNMENT_DETAILS: orgId => `/${orgId}/assignments/details`,

  // Reminders
  REMINDERS: orgId => `/${orgId}/organization_reminders`,

  // Organization Assets
  ORGANIZATION_ASSETS: orgId => `/${orgId}/organization_assets`,
  SEARCH_OBJECT: orgId => `/${orgId}/organization_assets/search_obj`,
  SCAN_OBJECT_SUCCESS: orgId =>
    `/${orgId}/organization_assets/scan_obj_succes_only`,
  ASSET_CATEGORIES_LOCATION: orgId =>
    `/${orgId}/organization_assets/asset_categories_of_location`,
  ASSET_CATEGORIES_PLANT: orgId =>
    `/${orgId}/organization_assets/asset_categories_of_plant`,
  UPDATE_AND_DESTROY: orgId =>
    `/${orgId}/organization_assets/update_and_destroy`,
  UPDATE_BY_AUDIT: orgId => `/${orgId}/organization_assets/update_by_audit`,
  FILTER_BY_ASSET_TYPE: orgId =>
    `/${orgId}/organization_assets/filter_by_asset_type`,
  AUDIT_LOGS: (orgId, assetId) =>
    `/${orgId}/organization_assets/${assetId}/audit_logs`,

  // Plan & Invoice
  USER_PLAN: orgId => `/${orgId}/company_priceplan/user_plan_details`,
  CANCEL_PLAN: orgId => `/${orgId}/company_priceplan/cancel_plan/`,
  INVOICE: orgId => `/${orgId}/invoice/user_plan_invoice`,
  PAY_INVOICE: orgId => `/${orgId}/invoice/invoice_paid/`,

  // Requests
  REQUESTS: orgId => `/${orgId}/requests`,
  PENDING_REQUESTS: orgId => `/${orgId}/requests/pending`,
  PENDING_COUNT: orgId => `/${orgId}/requests/pending_count`,
  APPROVE_REQUEST: (orgId, requestId) =>
    `/${orgId}/requests/${requestId}/approve`,
  REJECT_REQUEST: (orgId, requestId) =>
    `/${orgId}/requests/${requestId}/reject`,
};
