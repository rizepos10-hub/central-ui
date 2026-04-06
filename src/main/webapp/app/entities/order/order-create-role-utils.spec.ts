import { isOrderCreateRoleSelectionPending, resolveOrderCreateRoleMode } from './order-create-role-utils';

describe('order-create role utils', () => {
  it('returns pending for dual-role users until a mode is selected', () => {
    expect(
      isOrderCreateRoleSelectionPending({
        isAdminRole: true,
        isSalesmanRole: true,
        roleMode: null,
      })
    ).toBe(true);

    expect(
      resolveOrderCreateRoleMode({
        isAdminRole: true,
        isSalesmanRole: true,
        roleMode: null,
      })
    ).toBeNull();
  });

  it('resolves dual-role users to admin when admin mode is selected', () => {
    expect(
      isOrderCreateRoleSelectionPending({
        isAdminRole: true,
        isSalesmanRole: true,
        roleMode: 'admin',
      })
    ).toBe(false);

    expect(
      resolveOrderCreateRoleMode({
        isAdminRole: true,
        isSalesmanRole: true,
        roleMode: 'admin',
      })
    ).toBe('admin');
  });

  it('resolves dual-role users to salesman when salesman mode is selected', () => {
    expect(
      resolveOrderCreateRoleMode({
        isAdminRole: true,
        isSalesmanRole: true,
        roleMode: 'salesman',
      })
    ).toBe('salesman');
  });

  it('keeps salesman-only users in salesman mode', () => {
    expect(
      resolveOrderCreateRoleMode({
        isAdminRole: false,
        isSalesmanRole: true,
        roleMode: null,
      })
    ).toBe('salesman');
  });

  it('defaults non-salesman users to admin mode', () => {
    expect(
      resolveOrderCreateRoleMode({
        isAdminRole: true,
        isSalesmanRole: false,
        roleMode: null,
      })
    ).toBe('admin');
  });
});
