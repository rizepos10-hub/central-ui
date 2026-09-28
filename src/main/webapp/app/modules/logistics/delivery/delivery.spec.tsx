import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import DeliveryRuns from './delivery-runs';
import CashHandover from './cash-handover';
import StaleReturns from './stale-returns';
import CreditMemos, { memoTotals } from './credit-memos';
import {
  closeHandover,
  fetchCreditMemo,
  fetchCreditMemos,
  fetchHandover,
  fetchHandovers,
  fetchRun,
  fetchRuns,
  fetchStaleReturns,
  fetchStop,
  releaseRuns,
  unlockRun,
} from './delivery.api';
import { IExpected, IHandoverDetail, IRunDetail, IRunSummary, IStopDetail, handoverPreview, runState, signedMoney } from './delivery.model';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { fetchDrivers } from '../route-definitions/route-definition.api';

jest.mock('./delivery.api', () => ({
  fetchRuns: jest.fn(),
  fetchRun: jest.fn(),
  fetchStop: jest.fn(),
  releaseRuns: jest.fn(),
  changeDriver: jest.fn(),
  unlockRun: jest.fn(),
  fetchHandovers: jest.fn(),
  fetchHandover: jest.fn(),
  closeHandover: jest.fn(),
  fetchCreditMemos: jest.fn(),
  fetchCreditMemo: jest.fn(),
  fetchStaleReturns: jest.fn(),
}));
jest.mock('./delivery-socket', () => ({ useDeliveryUpdates: jest.fn() }));
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn() }));
jest.mock('../customers/wholesale-customer.api', () => ({ fetchRouteDefinitions: jest.fn() }));
jest.mock('../route-definitions/route-definition.api', () => ({ fetchDrivers: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const renderPage = (page: React.ReactNode, authorities: string[] = [AUTHORITIES.WHOLESALE_ADMIN], path = '/') => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </Provider>,
  );
};

const summary = (overrides: Partial<IRunSummary> = {}): IRunSummary => ({
  id: 'run-1',
  name: 'Windsor North',
  routeDefinitionId: 'r-1',
  deliveryDate: '2026-09-28',
  factoryId: 'f-win',
  driverUserId: 'd-1',
  driverUsername: 'dana',
  status: 'IN_PROGRESS',
  locked: false,
  stopsDone: 1,
  stopsTotal: 2,
  ...overrides,
});

const runDetail = (run: IRunSummary): IRunDetail => ({
  run,
  stops: [
    { sequence: 1, orderId: 'o-1', businessName: 'Corner Cafe', status: 'VISITED', address: '1 Main St', total: 25, amountDue: 0 },
    { sequence: 2, orderId: 'o-2', businessName: 'Lake Bistro', status: 'PENDING', total: 40, amountDue: 40 },
  ],
});

const stopDetail: IStopDetail = {
  runId: 'run-1',
  runLocked: false,
  stop: { sequence: 1, orderId: 'o-1', businessName: 'Corner Cafe', status: 'VISITED', address: '1 Main St' },
  lines: [{ itemId: 'bread', name: 'White Bread', orderedAmount: 12, approvedAmount: 10, amount: 8, deliveredAmount: 8, price: 2.5, reason: 'Damaged' }],
  bill: { total: 20, paid: 20, remaining: 0, invoiceNumber: 1001 },
  delivery: {
    outcome: 'CHECK',
    amountCollected: 20,
    checkNumber: '10042',
    basketsReturned: 3,
    deliveredAt: '2026-09-28T09:30:00Z',
    deliveredBy: 'dana',
    signatureUrl: 'https://files/sig.png',
    latitude: 42.31,
    longitude: -83.03,
    staleReturns: [{ itemId: 'rolls', itemName: 'Rolls', quantity: 4, reason: 'STALE', unitCredit: 0.5 }],
  },
  creditMemos: [],
};

describe('delivery model', () => {
  it('names the run state and signs the difference', () => {
    expect(runState(summary({ locked: true })).label).toBe('Submitted');
    expect(runState(summary({ stopsDone: 2 })).label).toBe('All stops done');
    expect(runState(summary({ stopsDone: 0, status: 'PLANNED' })).label).toBe('Not started');
    expect(signedMoney(-2)).toBe('-$2.00');
    expect(signedMoney(0.001)).toBe('$0.00');
    expect(signedMoney(1.5)).toBe('+$1.50');
  });

  it('works out the cash difference and missing checks like central', () => {
    const expected: IExpected = {
      cash: 50,
      checks: [
        { checkNumber: '1', amount: 10 },
        { checkNumber: '2', amount: 5 },
      ],
      checksTotal: 15,
      onAccount: 0,
      notPaid: 0,
      basketsReturned: 0,
      staleCredit: 0,
      stopsDone: 2,
      stopsTotal: 2,
    };
    const preview = handoverPreview(expected, 48, [' 1 ']);
    expect(preview.cashDifference).toBe(-2);
    expect(preview.missingChecks.map(c => c.checkNumber)).toEqual(['2']);
  });

  it('leaves void memos out of the totals', () => {
    expect(
      memoTotals([
        { id: 'a', status: 'OPEN', total: 10 },
        { id: 'b', status: 'APPLIED', total: 5.5 },
        { id: 'c', status: 'VOID', total: 100 },
      ]),
    ).toEqual({ count: 2, total: 15.5, open: 10 });
  });
});

describe('Delivery Runs page', () => {
  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([{ id: 'f-win', name: 'Windsor', active: true }]);
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([{ id: 'r-1', name: 'Windsor North', factoryId: 'f-win' }]);
    jest.mocked(fetchDrivers).mockResolvedValue([{ id: 'd-1', username: 'dana', firstName: 'Dana' }]);
    jest.mocked(fetchRuns).mockResolvedValue([summary()]);
    jest.mocked(fetchRun).mockResolvedValue(runDetail(summary()));
    jest.mocked(fetchStop).mockResolvedValue(stopDetail);
  });

  it('shows the runs of the day and a stop as the driver recorded it', async () => {
    renderPage(<DeliveryRuns />);
    const list = await screen.findByTestId('run-list');
    expect(await within(list).findByText('Dana (dana) / Windsor')).toBeTruthy();
    expect(within(list).getByText('1 / 2 stops')).toBeTruthy();

    fireEvent.click(await screen.findByText('Corner Cafe'));
    const stop = await screen.findByTestId('stop-detail');
    const row = within(stop).getByText('White Bread').closest('tr');
    expect(Array.from(row.querySelectorAll('td')).map(td => td.textContent)).toEqual(['White Bread', '12', '10', '8', 'Damaged']);
    expect(within(stop).getByText('10042')).toBeTruthy();
    expect(within(stop).getByText('Stale returns, $2.00 credit')).toBeTruthy();
    expect(within(stop).getByAltText('Customer signature')).toBeTruthy();
    expect(within(stop).getByText(/42.31000, -83.03000/).closest('a').getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=42.31,-83.03',
    );
  });

  it('lets a bookkeeper unlock a submitted run but not release or change drivers', async () => {
    const locked = summary({ locked: true, stopsDone: 2, submittedAt: '2026-09-28T15:00:00Z', submittedBy: 'dana' });
    jest.mocked(fetchRuns).mockResolvedValue([locked]);
    jest.mocked(fetchRun).mockResolvedValue(runDetail(locked));
    jest.mocked(unlockRun).mockResolvedValue(runDetail(summary()));
    renderPage(<DeliveryRuns />, [AUTHORITIES.WHOLESALE_BOOKKEEPER]);

    fireEvent.click(await screen.findByRole('button', { name: 'Unlock' }));
    expect(screen.queryByText('Release now')).toBeNull();
    expect(screen.queryByLabelText('Driver')).toBeNull();
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Unlock' }));
    await waitFor(() => expect(unlockRun).toHaveBeenCalledWith('run-1'));
  });

  it('releases the orders of the chosen factory now', async () => {
    jest.mocked(releaseRuns).mockResolvedValue({ runs: [summary()], ordersReleased: 3, heldRouteDefinitionIds: [] });
    renderPage(<DeliveryRuns />, [AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Corner Cafe');
    expect(screen.queryByRole('button', { name: 'Unlock' })).toBeNull();

    fireEvent.click(screen.getByText('Release now'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Release' }));
    await waitFor(() => expect(releaseRuns).toHaveBeenCalledWith(expect.any(String), 'f-win', null));
  });
});

describe('Cash Handover page', () => {
  const expected: IExpected = {
    cash: 120,
    checks: [
      { orderId: 'o-1', customerName: 'Corner Cafe', checkNumber: '10042', amount: 20 },
      { orderId: 'o-2', customerName: 'Lake Bistro', checkNumber: '10043', amount: 35 },
    ],
    checksTotal: 55,
    onAccount: 40,
    notPaid: 10,
    basketsReturned: 6,
    staleCredit: 2,
    stopsDone: 4,
    stopsTotal: 4,
  };
  const row = { runId: 'run-1', runName: 'Windsor North', deliveryDate: '2026-09-28', driverUserId: 'd-1', runSubmitted: true, expected, closed: false };
  const open: IHandoverDetail = {
    row,
    stops: [{ sequence: 1, orderId: 'o-1', customerName: 'Corner Cafe', outcome: 'CHECK', amountCollected: 20, checkNumber: '10042', staleCredit: 0, notPaid: 0 }],
  };

  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([]);
    jest.mocked(fetchDrivers).mockResolvedValue([{ id: 'd-1', username: 'dana', firstName: 'Dana' }]);
    jest.mocked(fetchHandovers).mockResolvedValue([row]);
    jest.mocked(fetchHandover).mockResolvedValue(open);
    jest.mocked(closeHandover).mockReset();
  });

  it('highlights the difference and missing checks, then closes with what was counted', async () => {
    const closed: IHandoverDetail = {
      ...open,
      row: { ...row, closed: true, cashHandedIn: 115, cashDifference: -5, missingCheckNumbers: ['10043'], closedAt: '2026-09-28T17:00:00Z', closedBy: 'mona' },
      handover: { cashHandedIn: 115, checksHandedIn: ['10042'], basketsHandedIn: 6, cashDifference: -5, closedBy: 'mona' },
    };
    jest.mocked(closeHandover).mockResolvedValue(closed);
    renderPage(<CashHandover />, [AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    const detail = await screen.findByTestId('handover-detail');
    expect(within(detail).getByText('$120.00')).toBeTruthy();

    fireEvent.click(within(detail).getByText('Close handover'));
    expect(await within(detail).findByText('Enter the cash handed in')).toBeTruthy();

    fireEvent.change(within(detail).getByLabelText('Cash'), { target: { value: '115' } });
    expect(within(detail).getByTestId('cash-difference').textContent).toBe('-$5.00 short');
    fireEvent.click(within(detail).getByLabelText('Check 10043'));
    expect(within(detail).getByText('Missing: #10043')).toBeTruthy();
    fireEvent.change(within(detail).getByLabelText('Baskets'), { target: { value: '6' } });

    fireEvent.click(within(detail).getByText('Close handover'));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Close handover' }));
    await waitFor(() => expect(closeHandover).toHaveBeenCalledWith('run-1', { cashHandedIn: 115, checksHandedIn: ['10042'], basketsHandedIn: 6, note: null }));
    expect(await screen.findByText(/by mona/)).toBeTruthy();
    expect(screen.queryByLabelText('Cash')).toBeNull();
    expect(screen.getByText('Missing checks: 10043')).toBeTruthy();
  });

  it('waits for the driver to submit before the handover can be closed', async () => {
    const delivering = { ...row, runSubmitted: false };
    jest.mocked(fetchHandovers).mockResolvedValue([delivering]);
    jest.mocked(fetchHandover).mockResolvedValue({ ...open, row: delivering });
    renderPage(<CashHandover />, [AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    expect(await screen.findByText('Can be closed once the driver submits the run.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close handover' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('Stale Returns and Credit Memos pages', () => {
  beforeEach(() => {
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([{ id: 'r-1', name: 'Windsor North' }]);
  });

  it('shows the credit totals per product and links each return to its order and memo', async () => {
    jest.mocked(fetchStaleReturns).mockResolvedValue({
      rows: [
        { id: 's-1', deliveryDate: '2026-09-28', routeDefinitionId: 'r-1', customerId: 'c-1', customerName: 'Corner Cafe', orderId: 'o-1', itemId: 'rolls', itemName: 'Rolls', quantity: 4, reason: 'STALE', unitCredit: 0.5, totalCredit: 2, creditMemoId: 'm-1' },
        { id: 's-2', deliveryDate: '2026-09-27', routeDefinitionId: 'r-1', customerId: 'c-2', customerName: 'Lake Bistro', orderId: 'o-2', itemId: 'rolls', itemName: 'Rolls', quantity: 2, reason: 'DAMAGED', unitCredit: 0, totalCredit: 0 },
      ],
      byProduct: [{ itemId: 'rolls', itemName: 'Rolls', quantity: 6, credit: 2 }],
      totalQuantity: 6,
      totalCredit: 2,
    });
    renderPage(<StaleReturns />);
    await screen.findByText('Lake Bistro');
    expect(screen.getByTestId('stat-Credit').textContent).toBe('$2.00');
    expect(screen.getByTestId('stat-Quantity').textContent).toBe('6');
    const rows = screen.getByTestId('stale-rows');
    expect(within(rows).getByText('Corner Cafe').closest('a').getAttribute('href')).toBe('/order/o-1');
    expect(within(rows).getByText('Open').getAttribute('href')).toBe('/logistics/credit-memos?memo=m-1');
    expect(within(rows).getByText('No credit')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
    await waitFor(() => expect(fetchStaleReturns).toHaveBeenLastCalledWith(expect.objectContaining({ from: '2026-09-01' })));
  });

  it('opens a memo from the link with its lines and source invoice', async () => {
    jest.mocked(fetchCreditMemos).mockResolvedValue([
      { id: 'm-1', number: 7, reason: 'STALE_RETURN', status: 'OPEN', customerName: 'Corner Cafe', orderId: 'o-1', invoiceNumber: 1001, total: 2 },
    ]);
    jest.mocked(fetchCreditMemo).mockResolvedValue({
      memo: { id: 'm-1', number: 7, reason: 'STALE_RETURN', status: 'OPEN', customerName: 'Corner Cafe', orderId: 'o-1', invoiceNumber: 1001, total: 2 },
      lines: [{ itemId: 'rolls', itemName: 'Rolls', quantity: 4, unitCredit: 0.5, total: 2, reason: 'STALE' }],
      sourceInvoice: { orderId: 'o-1', invoiceNumber: 1001, billTotal: 20 },
    });
    renderPage(<CreditMemos />, [AUTHORITIES.WHOLESALE_BOOKKEEPER], '/logistics/credit-memos?memo=m-1');

    const detail = await screen.findByTestId('memo-detail');
    expect(fetchCreditMemo).toHaveBeenCalledWith('m-1');
    expect(within(detail).getByText('Stale')).toBeTruthy();
    expect(within(detail).getByText('#1001, $20.00')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open order' }).getAttribute('href')).toBe('/order/o-1');
    expect(within(screen.getByTestId('memo-rows')).getByText('#1001').getAttribute('href')).toBe('/order/o-1');
  });
});
