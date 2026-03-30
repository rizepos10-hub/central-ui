import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderCreate from './order-create';
import * as orderReducer from './order.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

let mockState: any;
let mockLocation = {
  search: '?registerId=reg-1',
  state: null,
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: any) => any) => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

jest.mock('app/entities/item/retail/product/product.reducer', () => ({
  filterEntities: jest.fn(() => ({ type: 'product/filterEntities' })),
}));

jest.mock('app/entities/branch/branch.reducer', () => ({
  getEntities: jest.fn(() => ({ type: 'branch/getEntities' })),
}));

jest.mock('app/entities/customer/customer.reducer', () => ({
  getEntities: jest.fn(() => ({ type: 'customer/getEntities' })),
}));

jest.mock('app/entities/term/retail-item-category/retail-item-category.reducer', () => ({
  getEntities: jest.fn(() => ({ type: 'category/getEntities' })),
}));

jest.mock('app/entities/settings/pricing-point/pricing-point.reducer', () => ({
  getEntities: jest.fn(() => ({ type: 'pricingPoint/getEntities' })),
}));

jest.mock('../settings/branch-registry/branch-registry.reducer', () => ({
  getEntitiesByType: jest.fn(() => ({ type: 'branchRegistry/getEntitiesByType' })),
}));

jest.mock('../settings/branch-registry/till/till.reducer', () => ({
  createEntity: jest.fn(() => ({ type: 'till/createEntity' })),
  closeEntity: jest.fn(() => ({ type: 'till/closeEntity' })),
  confirmCloseEntity: jest.fn(() => ({ type: 'till/confirmCloseEntity' })),
  getEntitiesByStatusOpened: jest.fn(() => ({ type: 'till/getEntitiesByStatusOpened' })),
}));

jest.mock('./order.reducer', () => {
  const createEntity = jest.fn(entity => ({ type: 'order/create_entity', payload: entity }));
  const updateEntity = jest.fn(entity => ({ type: 'order/update_entity', payload: entity }));

  (createEntity as any).fulfilled = {
    match: (action: { type?: string }) => action?.type === 'order/create_entity/fulfilled',
  };

  (updateEntity as any).fulfilled = {
    match: (action: { type?: string }) => action?.type === 'order/update_entity/fulfilled',
  };

  return {
    calculateItemPrice: jest.fn(() => ({ type: 'order/calculate_item_price' })),
    changeEntityField: jest.fn(payload => ({ type: 'order/changeEntityField', payload })),
    createEntity,
    updateEntity,
    reset: jest.fn(() => ({ type: 'order/reset' })),
  };
});

jest.mock('app/entities/customer/components/DeliveryAddressDialog', () => () => null);
jest.mock('../customer/customer-update', () => () => null);
jest.mock('app/shared/components/pagination/pagination-filter', () => () => null);
jest.mock('app/shared/components/filter/drop-down-filter', () => () => null);

jest.mock('app/shared/components/select/select', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, placeholder, isDisabled, className }: any) => (
    <select
      aria-label={placeholder || 'select'}
      className={className}
      disabled={isDisabled}
      value={value?.value ?? ''}
      onChange={event => {
        const nextOption = options.find((option: any) => String(option.value) === event.target.value) || null;
        onChange?.(nextOption);
      }}
    >
      <option value="">{placeholder || 'select'}</option>
      {options.map((option: any) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockLocation = {
    search: '?registerId=reg-1',
    state: null,
  };

  mockState = {
    order: {
      entity: {
        items: [
          {
            cartId: 'cart-1',
            itemId: 'item-1',
            variantId: 'variant-1',
            variantName: 'Variant 1',
            amount: 1,
            price: 15,
          },
        ],
        branchId: 'branch-1',
        orderMethod: OrderMethod.Delivery,
        scheduledAt: null,
        deliverTo: null,
      },
      loading: false,
      itemPriceLoading: {},
      itemPriceCalculations: {},
    },
    product: {
      entities: [],
      totalItems: 0,
    },
    branch: {
      entities: [],
    },
    customer: {
      entities: [],
    },
    pricingPoint: {
      entities: [],
    },
    branchRegistry: {
      entities: [
        {
          id: 'reg-1',
          branch: {
            id: 'branch-1',
            name: 'Main Branch',
          },
        },
      ],
    },
    authentication: {
      account: {
        authorities: [],
      },
    },
  };

  mockDispatch.mockImplementation(action => {
    if (action?.type === 'order/create_entity') {
      return Promise.resolve({
        type: 'order/create_entity/fulfilled',
        payload: {
          data: {
            id: 'created-order-id',
          },
        },
      });
    }

    if (action?.type === 'order/update_entity') {
      return Promise.resolve({
        type: 'order/update_entity/fulfilled',
        payload: {
          data: {
            id: 'updated-order-id',
          },
        },
      });
    }

    if (action?.type === 'till/getEntitiesByStatusOpened') {
      return Promise.resolve({
        type: 'till/getEntitiesByStatusOpened/fulfilled',
        payload: {
          data: [
            {
              id: 'till-1',
              registry: {
                branch: {
                  id: 'branch-1',
                },
              },
            },
          ],
        },
      });
    }

    if (action?.type === 'order/calculate_item_price') {
      return Promise.resolve({
        type: 'order/calculate_item_price/fulfilled',
        payload: {
          cartId: action.payload?.cartId ?? 'cart-1',
          data: {
            grandTotal: 15,
            itemTotal: 15,
            taxTotal: 0,
          },
        },
      });
    }

    if (typeof action?.type === 'string' && action.type.startsWith('till/')) {
      return Promise.resolve({
        type: `${action.type}/fulfilled`,
        payload: {
          data: [],
        },
      });
    }

    return action;
  });
});

const renderOrderCreate = (authorities: string[]) => {
  mockState.authentication.account.authorities = authorities;
  return render(<OrderCreate />);
};

describe('OrderCreate dual-role validation', () => {
  it('shows the chooser and lets dual-role admins submit without salesman-required fields', async () => {
    renderOrderCreate(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_SALESMAN']);

    expect(screen.getByText('Select your mode')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /continue as admin/i }));

    await waitFor(() => {
      expect(screen.queryByText(/before creating an order\./i)).toBeNull();
    });

    const placeOrderButton = (await screen.findByRole('button', { name: /place order/i })) as HTMLButtonElement;
    expect(placeOrderButton.disabled).toBe(false);

    fireEvent.click(placeOrderButton);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          scheduledAt: null,
          deliverTo: null,
          orderMethod: OrderMethod.Delivery,
        })
      );
    });
  });

  it('keeps salesman validation active when a dual-role user chooses salesman', async () => {
    renderOrderCreate(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_SALESMAN']);

    fireEvent.click(screen.getByRole('button', { name: /continue as salesman/i }));

    await waitFor(() => {
      expect(screen.getByText(/before creating an order\./i)).not.toBeNull();
    });

    expect((await screen.findByRole('button', { name: /place order/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByPlaceholderText('Search for products') as HTMLInputElement).disabled).toBe(true);
  });

  it('keeps salesman-only users gated without showing the chooser', async () => {
    renderOrderCreate(['ROLE_WHOLESALE_SALESMAN']);

    await waitFor(() => {
      expect(screen.getByText(/before creating an order\./i)).not.toBeNull();
    });

    expect(screen.queryByText('Select your mode')).toBeNull();
    expect((screen.getByRole('button', { name: /place order/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
