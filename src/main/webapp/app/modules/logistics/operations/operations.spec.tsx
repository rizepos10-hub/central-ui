import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import OrderSheets from './order-sheets';
import FactoryOrders from './factory-orders';
import FactoryOrderDetail from './factory-order-detail';
import FactoryFulfillment from './factory-fulfillment';
import {
  allocateShortages,
  approveFactoryOrder,
  fetchFactoryBoard,
  fetchFactoryInbox,
  fetchFactoryOrder,
  fetchFactoryOrderCustomers,
  fetchOrderSheets,
  reopenOrderSheet,
  sendFactoryOrder,
  submitOrderSheet,
} from './operations.api';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { fetchSettings } from '../settings/wholesale-settings.api';
import {
  IFactoryOrder,
  IOrderSheetRow,
  IProductCustomers,
  amendmentChanges,
  hasShortage,
  routeProgress,
  toAllocation,
  tomorrow,
  validateAvailability,
  validateManual,
} from './operations.model';

jest.mock('./operations.api');
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn() }));
jest.mock('../settings/wholesale-settings.api', () => ({ fetchSettings: jest.fn() }));
jest.mock('./factory-socket', () => ({ useFactoryUpdates: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const DAY = '2026-10-06';

const sheet = (overrides: Partial<IOrderSheetRow> = {}): IOrderSheetRow => ({
  routeId: 'north',
  routeName: 'North',
  deliveryDate: DAY,
  orderCount: 3,
  customerCount: 3,
  quantity: 40,
  status: 'NOT_SUBMITTED',
  canSubmit: true,
  canApprove: false,
  canReopen: false,
  ...overrides,
});

const factoryOrder = (overrides: Partial<IFactoryOrder> = {}): IFactoryOrder => ({
  id: 'fo-1',
  factoryId: 'f-1',
  deliveryDate: DAY,
  version: 1,
  status: 'SENT',
  lines: [
    {
      itemId: 'rolls',
      itemName: 'Rolls',
      requestedQty: 20,
      routeBreakdown: [
        { routeDefinitionId: 'north', qty: 12 },
        { routeDefinitionId: 'south', qty: 8 },
      ],
    },
    { itemId: 'bread', variantId: 'loaf', itemName: 'Bread', requestedQty: 10, routeBreakdown: [{ routeDefinitionId: 'north', qty: 10 }] },
  ],
  history: [],
  ...overrides,
});

const rollsCustomers: IProductCustomers = {
  key: 'rolls|',
  itemId: 'rolls',
  itemName: 'Rolls',
  requestedQty: 20,
  availableQty: 15,
  customers: [
    { orderId: 'o-1', customerName: 'Cafe', quantity: 12 },
    { orderId: 'o-2', customerName: 'Deli', quantity: 8 },
  ],
};

const renderWith = (element: React.ReactElement, authorities: string[], path = '/', route = '/') => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
          <Route path="/logistics/factory-orders/:id" element={<div>detail page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('operations model', () => {
  it('needs a reason only for short lines and keeps quantities within the request', () => {
    const order = factoryOrder();
    expect(validateAvailability(order.lines, { 'rolls|': { itemId: 'rolls', availableQty: 15 } })).toEqual({ 'rolls|': 'Choose why it is short' });
    expect(validateAvailability(order.lines, { 'rolls|': { itemId: 'rolls', availableQty: 25 } })).toEqual({ 'rolls|': 'Enter 0 to 20' });
    expect(validateAvailability(order.lines, { 'rolls|': { itemId: 'rolls', availableQty: 15, reason: 'STAFF' } })).toEqual({});
    expect(hasShortage(order.lines, { 'rolls|': { itemId: 'rolls', availableQty: 20 } })).toBe(false);
    expect(hasShortage(order.lines, { 'rolls|': { itemId: 'rolls', availableQty: 19 } })).toBe(true);
  });

  it('turns each shortage choice into the allocation request', () => {
    const line = { ...factoryOrder().lines[0], availableQty: 15 };
    expect(toAllocation(line, { option: 'PRIORITY' })).toEqual({ allocation: { itemId: 'rolls', variantId: null, method: 'PRIORITY' } });
    expect(toAllocation(line, { option: 'MOVE' })).toEqual({ error: 'Choose the factory' });
    expect(toAllocation(line, { option: 'MOVE', moveToFactoryId: 'f-2' }).allocation).toEqual({ itemId: 'rolls', variantId: null, moveToFactoryId: 'f-2' });
    expect(toAllocation(line, { option: 'SUBSTITUTE', substituteKey: 'bread|loaf' }).allocation).toMatchObject({
      method: 'PROPORTIONAL',
      substituteItemId: 'bread',
      substituteVariantId: 'loaf',
    });
    expect(toAllocation(line, { option: 'MANUAL', manual: { 'o-1': 10, 'o-2': 6 } }, rollsCustomers)).toEqual({ error: expect.stringContaining('more than the 15') });
    expect(toAllocation(line, { option: 'MANUAL', manual: { 'o-1': 9, 'o-2': 6 } }, rollsCustomers).allocation).toMatchObject({ method: 'MANUAL' });
  });

  it('checks manual quantities per customer', () => {
    expect(validateManual(rollsCustomers, { 'o-1': 13, 'o-2': 0 })).toBe('Cafe can get 0 to 12');
    expect(validateManual(rollsCustomers, { 'o-1': 5 })).toBe('Enter the quantity for each customer');
    expect(validateManual(rollsCustomers, { 'o-1': 10, 'o-2': 5 })).toBeNull();
  });

  it('sends only amended quantities that changed', () => {
    expect(amendmentChanges([rollsCustomers], { 'rolls|': { 'o-1': 12, 'o-2': 10 } })).toEqual([
      { orderId: 'o-2', itemId: 'rolls', variantId: null, quantity: 10 },
    ]);
  });

  it('marks a route ready or dispatched only when every product on it is', () => {
    const order = factoryOrder();
    order.lines[0].routeBreakdown[0].readyAt = '2026-10-06T05:00:00Z';
    expect(routeProgress(order, 'north')).toEqual({ ready: false, dispatched: false });
    order.lines[1].routeBreakdown[0].readyAt = '2026-10-06T05:10:00Z';
    expect(routeProgress(order, 'north')).toEqual({ ready: true, dispatched: false });
    expect(tomorrow(new Date(2026, 11, 31))).toBe('2027-01-01');
  });
});

describe('Operations pages', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2026, 9, 5, 9, 0),
      doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'],
    });
  });
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchFactories).mockResolvedValue([
      { id: 'f-1', name: 'Windsor Bakery', active: true },
      { id: 'f-2', name: 'Toronto Bakery', active: true },
    ]);
    jest.mocked(fetchSettings).mockResolvedValue({ defaultShortageAllocation: 'PROPORTIONAL' });
  });

  it('submits a route for tomorrow with a note', async () => {
    jest.mocked(fetchOrderSheets).mockResolvedValue([sheet()]);
    jest.mocked(submitOrderSheet).mockResolvedValue(sheet({ status: 'PENDING_APPROVAL', canSubmit: false }));
    renderWith(<OrderSheets />, [AUTHORITIES.WHOLESALE_SALESMAN]);

    const row = await screen.findByTestId('sheet-north');
    expect(fetchOrderSheets).toHaveBeenCalledWith(DAY, null);
    fireEvent.click(within(row).getByText('Submit'));
    fireEvent.change(await screen.findByLabelText('Note'), { target: { value: 'All in' } });
    fireEvent.click(screen.getByText('Submit for approval'));

    await waitFor(() => expect(submitOrderSheet).toHaveBeenCalledWith('north', DAY, 'All in'));
    expect(await within(screen.getByTestId('sheet-north')).findByText('Waiting for approval')).toBeTruthy();
  });

  it('asks why a route is reopened', async () => {
    jest.mocked(fetchOrderSheets).mockResolvedValue([sheet({ status: 'APPROVED', canSubmit: false, canReopen: true })]);
    jest.mocked(reopenOrderSheet).mockResolvedValue(sheet({ status: 'REOPENED', reopenReason: 'Late order' }));
    renderWith(<OrderSheets />, [AUTHORITIES.WHOLESALE_SALES_MANAGER]);

    fireEvent.click(within(await screen.findByTestId('sheet-north')).getByText('Reopen'));
    fireEvent.click(await screen.findByRole('button', { name: 'Reopen' }));
    expect(await screen.findByText('Say why the route is reopened')).toBeTruthy();
    expect(reopenOrderSheet).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Why is it reopened?'), { target: { value: 'Late order' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(reopenOrderSheet).toHaveBeenCalledWith('north', DAY, 'Late order'));
  });

  it('sends a factory order from the board and opens it', async () => {
    jest.mocked(fetchFactoryBoard).mockResolvedValue([
      { factoryId: 'f-1', factoryName: 'Windsor Bakery', deliveryDate: DAY, approvedRoutes: 1, pendingRoutes: 1, routesWithOrders: 2 },
    ]);
    jest.mocked(sendFactoryOrder).mockResolvedValue({ order: factoryOrder(), factoryName: 'Windsor Bakery', routeNames: {} });
    renderWith(<FactoryOrders />, [AUTHORITIES.WHOLESALE_SALES_MANAGER]);

    const row = await screen.findByTestId('factory-f-1');
    expect(within(row).getByText('Not sent')).toBeTruthy();
    fireEvent.click(within(row).getByText('Send'));
    expect(await screen.findByText(/1 routes are not approved and are left out/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(sendFactoryOrder).toHaveBeenCalledWith('f-1', DAY, ''));
    expect(await screen.findByText('detail page')).toBeTruthy();
  });

  it('hides Send from bookkeepers', async () => {
    jest.mocked(fetchFactoryBoard).mockResolvedValue([
      { factoryId: 'f-1', factoryName: 'Windsor Bakery', deliveryDate: DAY, approvedRoutes: 2, pendingRoutes: 0, routesWithOrders: 2 },
    ]);
    renderWith(<FactoryOrders />, [AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    const row = await screen.findByTestId('factory-f-1');
    expect(within(row).queryByText('Send')).toBeNull();
  });

  it('allocates the shortages of a returned order with the default method', async () => {
    const returned = factoryOrder({
      status: 'RETURNED',
      returnNote: 'Oven down',
      lines: [{ ...factoryOrder().lines[0], availableQty: 15, shortageReason: 'EQUIPMENT' }, { ...factoryOrder().lines[1], availableQty: 10 }],
    });
    jest.mocked(fetchFactoryOrder).mockResolvedValue({ order: returned, factoryName: 'Windsor Bakery', routeNames: { north: 'North', south: 'South' } });
    jest.mocked(fetchFactoryOrderCustomers).mockResolvedValue([rollsCustomers]);
    jest.mocked(allocateShortages).mockResolvedValue({
      factoryOrder: { order: factoryOrder({ version: 2 }), factoryName: 'Windsor Bakery', routeNames: {} },
      affected: [{ orderId: 'o-1', customerName: 'Cafe', itemName: 'Rolls', fromQty: 12, toQty: 9 }],
    });
    renderWith(<FactoryOrderDetail />, [AUTHORITIES.WHOLESALE_SALES_MANAGER], '/logistics/factory-orders/fo-1', '/logistics/factory-orders/:id');

    expect(await screen.findByText('Oven down')).toBeTruthy();
    const panel = await screen.findByTestId('allocation-panel');
    expect(within(panel).getByText(/15 of 20 available, 5 short/)).toBeTruthy();
    await waitFor(() => expect(fetchFactoryOrderCustomers).toHaveBeenCalledWith('fo-1'));
    fireEvent.click(within(panel).getByText('Allocate and send version 2'));

    await waitFor(() => expect(allocateShortages).toHaveBeenCalledWith('fo-1', 1, [{ itemId: 'rolls', variantId: null, method: 'PROPORTIONAL' }], ''));
    expect(await screen.findByText('Cafe: Rolls 12 to 9')).toBeTruthy();
  });

  it('lets the factory approve the version it sees, and asks for a reason when it can make less', async () => {
    jest.mocked(fetchFactoryInbox).mockResolvedValue([
      {
        id: 'fo-1',
        factoryId: 'f-1',
        factoryName: 'Windsor Bakery',
        deliveryDate: DAY,
        version: 1,
        status: 'SENT',
        lineCount: 2,
        requestedTotal: 30,
        routeCount: 2,
      },
    ]);
    jest.mocked(fetchFactoryOrder).mockResolvedValue({ order: factoryOrder(), factoryName: 'Windsor Bakery', routeNames: { north: 'North', south: 'South' } });
    jest.mocked(approveFactoryOrder).mockResolvedValue({ order: factoryOrder({ status: 'APPROVED' }), factoryName: 'Windsor Bakery', routeNames: {} });
    renderWith(<FactoryFulfillment />, [AUTHORITIES.WHOLESALE_FACTORY]);

    await screen.findByTestId('factory-order-lines');
    expect(fetchFactoryInbox).toHaveBeenCalledWith('2026-10-05');

    fireEvent.change(screen.getByLabelText('Can make Rolls'), { target: { value: '15' } });
    fireEvent.click(screen.getByText('Return with shortages'));
    expect(await screen.findByText('Choose why it is short')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Can make Rolls'), { target: { value: '20' } });
    fireEvent.click(screen.getByText('Approve version 1'));
    await waitFor(() => expect(approveFactoryOrder).toHaveBeenCalledWith('fo-1', 1, 'WEB', ''));
  });
});
