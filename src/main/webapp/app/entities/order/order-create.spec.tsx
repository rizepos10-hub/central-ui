import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderCreate from './order-create';
import * as orderReducer from './order.reducer';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

let mockState;
let mockLocation = {
  search: '?registerId=reg-1',
  state: null,
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
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
  getEntity: jest.fn(id => ({ type: 'customer/getEntity', payload: id })),
}));

jest.mock('app/entities/settings/on-account/on-account-settings.reducer', () => ({
  getOnAccountSettings: jest.fn(() => ({ type: 'onAccountSettings/get' })),
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

jest.mock('./order.reducer', () => ({
  calculateItemPrice: jest.fn(payload => ({
    type: 'order/calculate_item_price/fulfilled',
    payload: {
      data: {
        itemTotal: 9,
        taxTotal: 0,
        grandTotal: 9,
      },
      ...payload,
    },
  })),
  changeEntityField: jest.fn(payload => ({ type: 'order/changeEntityField', payload })),
  clearChargesPreview: jest.fn(() => ({ type: 'order/clear_charges_preview' })),
  createEntity: jest.fn(entity => ({ type: 'order/create_entity', payload: entity })),
  updateEntity: jest.fn(entity => ({ type: 'order/update_entity', payload: entity })),
  createDraftBill: jest.fn(payload => ({ type: 'order/create_draft_bill', payload })),
  addPaymentToBill: jest.fn(payload => ({ type: 'order/add_payment_to_bill', payload })),
  previewCharges: jest.fn(entity => ({ type: 'order/preview_charges', payload: entity })),
  reset: jest.fn(() => ({ type: 'order/reset' })),
}));

jest.mock('app/entities/customer/components/DeliveryAddressDialog', () => () => null);
jest.mock('../customer/customer-update', () => () => null);
jest.mock('app/shared/components/pagination/pagination-filter', () => () => null);
jest.mock('app/shared/components/filter/drop-down-filter', () => () => null);

jest.mock('app/shared/components/select/select', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, placeholder, isDisabled, className }) => (
    <select
      aria-label={placeholder || 'select'}
      className={className}
      disabled={isDisabled}
      value={value?.value ?? ''}
      onChange={event => {
        const nextOption = options.find(option => String(option.value) === event.target.value) || null;
        onChange?.(nextOption);
      }}
    >
      <option value="">{placeholder || 'select'}</option>
      {options.map(option => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
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

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (orderReducer.calculateItemPrice as any).fulfilled = {
    match: action => action?.type === 'order/calculate_item_price/fulfilled',
  };
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
        customer: {
          id: 'customer-1',
        },
        orderMethod: OrderMethod.Delivery,
        scheduledAt: null,
        deliverTo: null,
      },
      loading: false,
      updating: false,
      itemPriceLoading: {},
      itemPriceCalculations: {},
      chargesPreview: null,
      chargesPreviewLoading: false,
      chargesPreviewError: null,
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
      entity: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitLimit: 100,
        onAccountDebitUsed: 20,
      },
    },
    pricingPoint: {
      entities: [],
    },
    onAccountSettings: {
      entity: {
        onAccountBalanceType: 'BY_BUSINESS',
      },
      loading: false,
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
    if (action?.type === 'order/calculate_item_price/fulfilled') {
      return Promise.resolve(action);
    }

    if (action?.type === 'order/create_entity') {
      return {
        unwrap: () =>
          Promise.resolve({
            data: {
              id: 'created-order-id',
            },
          }),
      };
    }

    if (action?.type === 'order/update_entity') {
      return {
        unwrap: () =>
          Promise.resolve({
            data: {
              id: 'updated-order-id',
            },
          }),
      };
    }

    if (action?.type === 'order/create_draft_bill') {
      return {
        unwrap: () =>
          Promise.resolve({
            data: {
              id: 'draft-bill-id',
            },
          }),
      };
    }

    if (action?.type === 'order/add_payment_to_bill') {
      return {
        unwrap: () =>
          Promise.resolve({
            data: {
              id: 'draft-bill-id',
            },
          }),
      };
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

    if (action?.type === 'order/preview_charges') {
      return Promise.resolve({
        type: 'order/preview_charges/fulfilled',
        payload: {
          totalCharges: 0,
          orderCharges: [],
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

const renderOrderCreate = authorities => {
  mockState.authentication.account.authorities = authorities;
  return render(<OrderCreate />);
};

const getLatestCreatePayload = () => orderReducer.createEntity.mock.calls[orderReducer.createEntity.mock.calls.length - 1][0];
const getLatestUpdatePayload = () => orderReducer.updateEntity.mock.calls[orderReducer.updateEntity.mock.calls.length - 1][0];

describe('OrderCreate payment flow', () => {
  it('does not send priceOverride for built-in discounted items unless the user overrides the price', async () => {
    mockState.order.entity.items = [
      {
        cartId: 'cart-1',
        itemId: 'item-1',
        variantId: 'variant-1',
        variantName: 'Variant 1',
        amount: 1,
        price: 10,
        customDiscount: 0,
      },
    ];
    mockState.product.entities = [
      {
        id: 'item-1',
        name: 'Product 1',
        attachments: [],
        variants: [
          {
            id: 'variant-1',
            name: 'Variant 1',
            price: 10,
            salePrice: null,
            attachments: [],
            discounts: [
              {
                type: 'PERCENTAGE',
                value: 50,
              },
            ],
          },
        ],
      },
    ];

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    fireEvent.click(await screen.findByText('Variant 1'));
    fireEvent.change(screen.getByPlaceholderText('Discount'), { target: { value: '50' } });

    await waitFor(() => {
      expect(orderReducer.calculateItemPrice).toHaveBeenCalled();
    });

    const lastPayload = orderReducer.calculateItemPrice.mock.calls[orderReducer.calculateItemPrice.mock.calls.length - 1][0];
    expect(lastPayload).toEqual(
      expect.objectContaining({
        cartId: 'cart-1',
        payload: expect.objectContaining({
          itemId: 'item-1',
          variantId: 'variant-1',
          discountOverride: {
            type: 'PERCENTAGE',
            value: 50,
          },
        }),
      })
    );
    expect(lastPayload.payload).not.toHaveProperty('priceOverride');
  });

  it('shows the base price in the unit-price input while displaying the built-in discounted price in the amount column', async () => {
    mockState.order.entity.items = [
      {
        cartId: 'cart-1',
        itemId: 'item-1',
        variantId: 'variant-1',
        variantName: 'Variant 1',
        amount: 1,
        price: 10,
        customDiscount: 0,
      },
    ];
    mockState.product.entities = [
      {
        id: 'item-1',
        name: 'Product 1',
        attachments: [],
        variants: [
          {
            id: 'variant-1',
            name: 'Variant 1',
            price: 10,
            salePrice: null,
            attachments: [],
            discounts: [
              {
                type: 'PERCENTAGE',
                value: 50,
              },
            ],
          },
        ],
      },
    ];

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    fireEvent.click(await screen.findByText('Variant 1'));

    const originalPrices = await screen.findAllByText('$10.00');
    const discountedPrices = await screen.findAllByText('$5.00');
    const unitPriceInput = screen.getByPlaceholderText('Price');
    const discountInput = screen.getByPlaceholderText('Discount');
    const struckThroughOriginalPrice = originalPrices.find(node => node.className.includes('line-through'));

    expect(struckThroughOriginalPrice?.className).toContain('line-through');
    expect(discountedPrices.length).toBeGreaterThan(0);
    expect(unitPriceInput.value).toBe('10');
    expect(discountInput.value).toBe('0');
  });

  it('lets dual-role admins create without payment and navigates directly to order detail', async () => {
    renderOrderCreate(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_SALESMAN']);

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }));

    expect(screen.getByText('Create Order & Payment')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /create without payment/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          orderMethod: OrderMethod.Delivery,
        })
      );
    });

    expect(getLatestCreatePayload().wholesale).toBeUndefined();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order/created-order-id');
    });
  });

  it('creates the order, draft bill, and payment when using create and pay with a partial amount', async () => {
    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }));

    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(amountInput, { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /create order & pay/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalled();
      expect(orderReducer.createDraftBill).toHaveBeenCalledWith({
        orderId: 'created-order-id',
        payee: null,
        createdBy: null,
        discount: null,
      });
      expect(orderReducer.addPaymentToBill).toHaveBeenCalledWith({
        orderId: 'created-order-id',
        billId: 'draft-bill-id',
        amount: 5,
        tipAmount: 0,
        transactionMethod: 'cash',
      });
    });

    expect(getLatestCreatePayload().wholesale).toBeUndefined();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order/created-order-id');
    });
  });

  it('sends wholesale in wholesale mode when creating without payment', async () => {
    mockLocation = {
      search: '?registerId=reg-1&mode=wholesale',
      state: null,
    };
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };

    renderOrderCreate(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_SALESMAN']);

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }));
    fireEvent.click(screen.getByRole('button', { name: /create wholesale order without payment/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalled();
    });

    expect(getLatestCreatePayload()).toEqual(
      expect.objectContaining({
        wholesale: true,
      })
    );

    expect(JSON.parse(localStorage.getItem('pos-cart:reg-1'))).toEqual(
      expect.objectContaining({
        items: [],
        customerId: 'customer-1',
        orderMethod: OrderMethod.Delivery,
        scheduledAt: '2026-03-30T10:00:00.000Z',
        scheduledAtLocal: expect.any(String),
        deliverTo: {
          id: 'address-1',
          address: 'Warehouse Street',
        },
      })
    );
  });

  it('sends wholesale for create and pay in wholesale mode', async () => {
    mockLocation = {
      search: '?registerId=reg-1&mode=wholesale',
      state: null,
    };
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };

    renderOrderCreate(['ROLE_WHOLESALE_SALESMAN']);

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }));

    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(amountInput, { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /create wholesale order & pay/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalled();
      expect(orderReducer.createDraftBill).toHaveBeenCalled();
      expect(orderReducer.addPaymentToBill).toHaveBeenCalled();
    });

    expect(getLatestCreatePayload()).toEqual(
      expect.objectContaining({
        wholesale: true,
      })
    );

    expect(JSON.parse(localStorage.getItem('pos-cart:reg-1'))).toEqual(
      expect.objectContaining({
        items: [],
        customerId: 'customer-1',
        orderMethod: OrderMethod.Delivery,
        scheduledAt: '2026-03-30T10:00:00.000Z',
        scheduledAtLocal: expect.any(String),
        deliverTo: {
          id: 'address-1',
          address: 'Warehouse Street',
        },
      })
    );
  });

  it('clears wholesale storage for non-salesman wholesale users after create', async () => {
    mockLocation = {
      search: '?registerId=reg-1&mode=wholesale',
      state: null,
    };
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    fireEvent.click(await screen.findByRole('button', { name: /place order/i }));
    fireEvent.click(screen.getByRole('button', { name: /create wholesale order without payment/i }));

    await waitFor(() => {
      expect(orderReducer.createEntity).toHaveBeenCalled();
    });

    expect(localStorage.getItem('pos-cart:reg-1')).toBeNull();
  });

  it('keeps pricing point enabled for wholesale salesman even before required fields are complete', async () => {
    mockLocation = {
      search: '?registerId=reg-1&mode=wholesale',
      state: null,
    };
    mockState.order.entity.customer = null;
    mockState.order.entity.scheduledAt = null;
    mockState.order.entity.deliverTo = null;
    mockState.pricingPoint.entities = [
      {
        id: 'pricing-point-1',
        name: 'VIP',
        type: 'USER_SELECTED',
        applicableBranches: [{ id: 'branch-1' }],
      },
    ];

    renderOrderCreate(['ROLE_WHOLESALE_SALESMAN']);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /pricing point/i }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('keeps wholesale validation active in wholesale mode', async () => {
    mockLocation = {
      search: '?registerId=reg-1&mode=wholesale',
      state: null,
    };
    renderOrderCreate(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_SALESMAN']);

    await waitFor(() => {
      expect(screen.getByText(/before creating a wholesale order\./i)).not.toBeNull();
    });

    expect((await screen.findByRole('button', { name: /place order/i })).disabled).toBe(true);
    expect(screen.getByPlaceholderText('Search for products').disabled).toBe(true);
  });

  it('updates existing orders directly without opening the payment dialog', async () => {
    mockLocation = {
      search: '?registerId=reg-1',
      state: {
        editOrder: {
          id: 'existing-order-id',
          branchId: 'branch-1',
        },
        orderId: 'existing-order-id',
      },
    };
    mockState.order.entity.id = 'existing-order-id';

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    fireEvent.click(await screen.findByRole('button', { name: /update order/i }));

    await waitFor(() => {
      expect(orderReducer.updateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-order-id',
        })
      );
    });

    expect(getLatestUpdatePayload().wholesale).toBeUndefined();

    expect(screen.queryByText('Create Order & Payment')).toBeNull();
  });

  it('requests a charge preview when the order has enough data and shows the previewed total', async () => {
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };
    mockState.order.chargesPreview = {
      deliveryCharge: {
        amount: 3,
        chargeType: 'SHIPPING_FEE',
      },
      orderCharges: [
        {
          amount: 2,
          chargeType: 'PLATFORM_FEE',
        },
      ],
      totalCharges: 5,
    };

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.previewCharges).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          orderMethod: OrderMethod.Delivery,
          deliverTo: expect.objectContaining({
            id: 'address-1',
          }),
        })
      );
    });

    expect(await screen.findByRole('button', { name: /place order/i })).not.toBeNull();
    expect(screen.queryByText('Service Charges')).toBeNull();
    expect(screen.queryByText('Shipping Fee')).toBeNull();
    expect(screen.getByText('Platform Fee')).not.toBeNull();
    expect(screen.getAllByText('$17.00').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(screen.getByText('Base Total:')).not.toBeNull();
    expect(screen.getByText('Final Total:')).not.toBeNull();
    expect(screen.getAllByText('$15.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$2.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$17.00').length).toBeGreaterThan(0);
  });

  it('requests a charge preview even before a delivery address is selected', async () => {
    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.previewCharges).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          orderMethod: OrderMethod.Delivery,
          deliverTo: null,
        })
      );
    });
  });

  it('does not request a charge preview when the branch id is missing', async () => {
    mockState.order.entity.branchId = null;

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.clearChargesPreview).toHaveBeenCalled();
    });

    expect(orderReducer.previewCharges).not.toHaveBeenCalled();
  });

  it('does not request a charge preview while item prices are still loading', async () => {
    mockState.order.itemPriceLoading = {
      'cart-1': true,
    };

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.clearChargesPreview).toHaveBeenCalled();
    });

    expect(orderReducer.previewCharges).not.toHaveBeenCalled();
  });

  it('does not request a charge preview when any item price is null', async () => {
    mockState.order.entity.items = [
      {
        cartId: 'cart-1',
        itemId: 'item-1',
        variantId: 'variant-1',
        variantName: 'Variant 1',
        amount: 1,
        price: null,
      },
    ];

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.clearChargesPreview).toHaveBeenCalled();
    });

    expect(orderReducer.previewCharges).not.toHaveBeenCalled();
  });

  it('shows a non-blocking preview failure message and keeps the order action enabled', async () => {
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };
    mockState.order.chargesPreviewError = 'Preview failed';

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    expect((await screen.findByRole('button', { name: /place order/i })).disabled).toBe(false);
    expect(await screen.findByText(/charge preview unavailable/i)).not.toBeNull();
  });

  it('hides service charge labels when preview total is zero', async () => {
    mockState.order.entity.scheduledAt = '2026-03-30T10:00:00.000Z';
    mockState.order.entity.deliverTo = {
      id: 'address-1',
      address: 'Warehouse Street',
    };
    mockState.order.chargesPreview = {
      totalCharges: 0,
      orderCharges: [
        {
          amount: 0,
          chargeType: 'PLATFORM_FEE',
        },
      ],
    };

    renderOrderCreate(['ROLE_ADMINISTRATOR']);

    await waitFor(() => {
      expect(orderReducer.previewCharges).toHaveBeenCalled();
    });

    expect(screen.queryByText('Service Charges')).toBeNull();
    expect(screen.queryByText('Platform Fee')).toBeNull();
  });
});
