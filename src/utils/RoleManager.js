export const ROLES = {
  SUPER_ADMIN: 'organization_super_admin',
  AUDIT_MEMBER: 'audit_member',
  EMPLOYEE: 'employee',
  APPROVER: 'approver',
};

// Module Definitions
// Module Definitions
const MODULES = {
  ASSETS: { id: 'assets', label: 'Assets', icon: 'box', route: 'AssetList' },
  CHECK_IN_OUT: {
    id: 'check_in_out',
    label: 'Check In/Out',
    icon: 'repeat',
    route: 'CheckInOut',
  },
  AUDITS: {
    id: 'audits',
    label: 'Audits',
    icon: 'clipboard',
    route: 'AuditList',
  },
  AUDIT_REPORTS: {
    id: 'audit_reports',
    label: 'Audit Reports',
    icon: 'file-text',
    route: 'AuditReports',
  },
  REMINDERS: {
    id: 'reminders',
    label: 'Reminders',
    icon: 'bell',
    route: 'Reminders',
  },
  APPROVALS: {
    id: 'approvals',
    label: 'Approvals',
    icon: 'check-circle',
    route: 'Approvals',
  },
  ASSIGNMENT: {
    id: 'assignment',
    label: 'Asset Assignment',
    icon: 'user-plus',
    route: 'AssetAssignment',
  },
  INVOICE: {
    id: 'invoice',
    label: 'Invoices',
    icon: 'dollar-sign',
    route: 'Invoices',
  },
  PLAN: {
    id: 'plan',
    label: 'Current Plan',
    icon: 'shield',
    route: 'CurrentPlan',
  },
  CHANGE_ORG: {
    id: 'change_org',
    label: 'Change Organization',
    icon: 'users',
    route: 'MyOrganizations',
  },
};

export const getUserRolesObject = roles => {
  let userRolesObject = {};
  const rawList = Array.isArray(roles) ? roles : [roles];
  // Normalize roles to handle case sensitivity and whitespace
  const roleList = rawList.map(r =>
    typeof r === 'string' ? r.toLowerCase().trim() : '',
  );

  if (roleList.includes('organization_super_admin'))
    userRolesObject.isOrganizationSuperAdmin = true;
  if (roleList.includes('audit_member')) userRolesObject.isAuditMember = true;
  if (roleList.includes('employee')) userRolesObject.isEmployee = true;
  if (roleList.includes('asset_assignment')) userRolesObject.isAssignee = true;
  if (roleList.includes('approver')) userRolesObject.isApprover = true;

  return userRolesObject;
};

export const getScreenAccess = ({
  isOrganizationSuperAdmin,
  isAuditMember,
  isEmployee,
  isAssignee,
  isApprover,
}) => {
  let accessibleScreens = {
    AssetCheckInOutScreen: false,
    AuditScreen: false,
    AuditReportScreen: false,
    ReminderScreen: false,
    AssetAssignmentScreen: false,
    AssetApprovalScreen: false,
    CurrentPlanScreen: false,
    InvoiceScreen: false,
  };

  if (isOrganizationSuperAdmin || isEmployee) {
    accessibleScreens.AssetCheckInOutScreen = true; // Maps to CHECK_IN_OUT
    accessibleScreens.AuditReportScreen = true; // Maps to AUDIT_REPORTS
    accessibleScreens.ReminderScreen = true; // Maps to REMINDERS
  }
  if (isAuditMember) {
    accessibleScreens.AuditScreen = true; // Maps to AUDITS
    accessibleScreens.AuditReportScreen = true; // Maps to AUDIT_REPORTS
  }
  if (isAssignee || isOrganizationSuperAdmin) {
    accessibleScreens.AssetAssignmentScreen = true; // Maps to ASSIGNMENT
  }
  if (isApprover || isOrganizationSuperAdmin) {
    accessibleScreens.AssetApprovalScreen = true; // Maps to APPROVALS
  }
  if (isOrganizationSuperAdmin) {
    accessibleScreens.CurrentPlanScreen = true; // Maps to PLAN
    accessibleScreens.InvoiceScreen = true; // Maps to INVOICE
  }

  return accessibleScreens;
};

export const getMenuItems = roleOrRoles => {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  const userRoles = getUserRolesObject(roles);

  const access = getScreenAccess(userRoles);

  let items = [];

  // Map access flags to MODULES
  if (access.AssetCheckInOutScreen) items.push(MODULES.CHECK_IN_OUT);
  if (access.AuditScreen) items.push(MODULES.AUDITS);
  if (access.AuditReportScreen) items.push(MODULES.AUDIT_REPORTS);
  if (access.ReminderScreen) items.push(MODULES.REMINDERS);
  if (access.AssetApprovalScreen) items.push(MODULES.APPROVALS);
  if (access.AssetAssignmentScreen) items.push(MODULES.ASSIGNMENT);
  if (access.InvoiceScreen) items.push(MODULES.INVOICE);
  if (access.CurrentPlanScreen) items.push(MODULES.PLAN);

  // Always include Change Org
  items.push(MODULES.CHANGE_ORG);

  // Eliminate duplicates if any (though logic above should prevent it)
  // Logic above adds sequentially so duplicates are unlikely unless mapped multiple times
  return items;
};

export const getPermissions = role => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return { canModifyAsset: true };
    case ROLES.EMPLOYEE:
    case ROLES.APPROVER:
      return { canModifyAsset: false }; // "cannot modify asset"
    default:
      return { canModifyAsset: false };
  }
};
