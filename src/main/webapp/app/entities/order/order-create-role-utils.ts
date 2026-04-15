export type OrderCreateRoleMode = 'salesman' | 'admin' | null;

interface ResolveOrderCreateRoleModeArgs {
  isAdminRole: boolean;
  isSalesmanRole: boolean;
  roleMode: OrderCreateRoleMode;
}

export const resolveOrderCreateRoleMode = ({
  isAdminRole,
  isSalesmanRole,
  roleMode,
}: ResolveOrderCreateRoleModeArgs): OrderCreateRoleMode => {
  if (isAdminRole && isSalesmanRole) {
    return roleMode;
  }

  if (isSalesmanRole) {
    return 'salesman';
  }

  return 'admin';
};

export const isOrderCreateRoleSelectionPending = ({
  isAdminRole,
  isSalesmanRole,
  roleMode,
}: ResolveOrderCreateRoleModeArgs): boolean => isAdminRole && isSalesmanRole && roleMode === null;
