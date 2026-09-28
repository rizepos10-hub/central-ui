import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import Reconciliation from './reconciliation';
import Alerts from './alerts';
import CustomerAccounts, { filterAging } from './customer-accounts';
import Invoices from './invoices';
import LiveRoute, { applyPosition } from './live-route';
import Dashboard, { presetRange, rangeDays } from './dashboard';
import { paymentErrors } from './account-actions';
import {
  acknowledgeAlert,
  fetchAccount,
  fetchAging,
  fetchAlerts,
  fetchDashboard,
  fetchInvoiceList,
  fetchLiveRoute,
  fetchReconciliation,
  fetchReconciliationRun,
  fetchStatement,
  fetchTrail,
  receivePayment,
} from './audits.api';
import {
  IAging,
  ICustomerAccount,
  IDashboard,
  IInvoice,
  ILiveDay,
  IMoney,
  IQuantities,
  IReconDay,
  IReconRun,
  ageLabel,
  allocateOldestFirst,
  sumAllocations,
} from './audits.model';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { fetchDrivers } from '../route-definitions/route-definition.api';

jest.mock('./audits.api', () => ({
  fetchReconciliation: jest.fn(),
  fetchReconciliationRun: jest.fn(),
  fetchAlerts: jest.fn(),
  fetchOpenAlertCount: jest.fn(),
  acknowledgeAlert: jest.fn(),
  fetchAging: jest.fn(),
  fetchAccount: jest.fn(),
  fetchStatement: jest.fn(),
  receivePayment: jest.fn(),
  applyMemo: jest.fn(),
  voidMemo: jest.fn(),
  fetchInvoiceList: jest.fn(),
  fetchLiveRoute: jest.fn(),
  fetchTrail: jest.fn(),
  fetchDashboard: jest.fn(),
}));
jest.mock('./audits-socket', () => ({ useAlertUpdates: jest.fn(), useLiveRouteUpdates: jest.fn() }));
jest.mock('../delivery/delivery-socket', () => ({ useDeliveryUpdates: jest.fn() }));
jest.mock('../delivery/delivery.api', () => ({ fetchStop: jest.fn() }));
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn() }));
jest.mock('../customers/wholesale-customer.api', () => ({ fetchRouteDefinitions: jest.fn() }));
jest.mock('../route-definitions/route-definition.api', () => ({ fetchDrivers: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));
jest.mock('react-to-print', () => ({ useReactToPrint: () => jest.fn() }));
jest.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Marker: ({ title, label }: { title?: string; label?: { text: string } }) => (
    <span data-testid="marker" data-label={label?.text}>
      {title}
    </span>
  ),
  useMap: () => null,
}));

const renderPage = (page: React.ReactNode, authorities: string[] = [AUTHORITIES.WHOLESALE_ADMIN], path = '/') => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </Provider>,
  );
};

const qty = (overrides: Partial<IQuantities> = {}): IQuantities => ({ ordered: 20, approved: 18, delivered: 17, staleReturned: 2, ...overrides });
const cash = (overrides: Partial<IMoney> = {}): IMoney => ({
  invoiced: 100,
  cash: 60,
  checks: 25,
  onAccount: 10,
  notPaid: 5,
  staleCredit: 3,
  deliveryChangeCredit: 0,
  cashHandedIn: 58,
  cashDifference: -2,
  ...overrides,
});
const aging = (overrides: Partial<IAging> = {}): IAging => ({ current: 50, days1to30: 30, days31to60: 0, days61to90: 0, days90plus: 20, total: 100, ...overrides });

const reconRun = (overrides: Partial<IReconRun> = {}): IReconRun => ({
  runId: 'run-1',
  runName: 'Windsor North',
  deliveryDate: '2026-09-28',
  driverUsername: 'dana',
  submitted: true,
  stopsDone: 2,
  stopsTotal: 2,
  quantities: qty(),
  money: cash(),
  basketsReturned: 4,
  handoverClosed: true,
  missingCheckNumbers: ['1002'],
  discrepancies: 1,
  unexplained: 1,
  ...overrides,
});

const invoice = (overrides: Partial<IInvoice> = {}): IInvoice => ({
  orderId: 'o-1',
  billId: 'b-1',
  invoiceNumber: 1001,
  invoiceDate: '2026-09-01',
  customerId: 'c-1',
  customerName: 'Corner Cafe',
  total: 40,
  paid: 0,
  onAccountCharged: 0,
  onAccountSettled: 0,
  open: 40,
  ageDays: 27,
  bucket: 'DAYS_1_30',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchFactories).mockResolvedValue([]);
  jest.mocked(fetchRouteDefinitions).mockResolvedValue([]);
  jest.mocked(fetchDrivers).mockResolvedValue([]);
});

describe('audit helpers', () => {
  it('spreads a payment over the oldest invoices first', () => {
    const invoices = [invoice({ billId: 'new', invoiceDate: '2026-09-20', open: 30 }), invoice({ billId: 'old', invoiceDate: '2026-09-01', open: 25 })];
    expect(allocateOldestFirst(invoices, 40)).toEqual({ old: 25, new: 15 });
    expect(allocateOldestFirst(invoices, 100)).toEqual({ old: 25, new: 30 });
    expect(sumAllocations({ a: 0.1, b: 0.2 })).toBe(0.3);
  });

  it('checks a payment like central', () => {
    expect(paymentErrors(null, 'CASH', '', 50, 0).amount).toBe('Enter the amount received');
    expect(paymentErrors(60, 'CASH', '', 50, 60).amount).toBe('The customer owes $50.00');
    expect(paymentErrors(20, 'CHECK', ' ', 50, 20).checkNumber).toBe('Enter the check number');
    expect(paymentErrors(20, 'CASH', '', 50, 15).allocations).toContain('add up to $15.00');
    expect(paymentErrors(20, 'CHECK', '77', 50, 20)).toEqual({});
  });

  it('filters aging rows and labels ages and ranges', () => {
    const rows = [
      { customerId: 'a', customerName: 'Corner Cafe', aging: aging(), openInvoices: 1, openCredit: 0 },
      { customerId: 'b', customerName: 'Lake Bistro', aging: aging(), openInvoices: 1, openCredit: 0 },
    ];
    expect(filterAging(rows, ' lake').map(r => r.customerId)).toEqual(['b']);
    expect(ageLabel(null)).toBe('No location yet');
    expect(ageLabel(30)).toBe('Just now');
    expect(ageLabel(3900)).toBe('1 h 5 min ago');
    expect(presetRange('week', new Date(2026, 8, 28))).toEqual({ from: '2026-09-22', to: '2026-09-28' });
    expect(presetRange('month', new Date(2026, 8, 28)).from).toBe('2026-09-01');
    expect(rangeDays('2026-09-01', '2026-09-30')).toBe(30);
  });

  it('moves a driver on a pushed position and ignores other days', () => {
    const day: ILiveDay = {
      date: '2026-09-28',
      intervalSeconds: 60,
      runs: [{ run: { id: 'run-1', deliveryDate: '2026-09-28', locked: false, stopsDone: 0, stopsTotal: 1 }, lastPosition: null, ageSeconds: 900, stale: true, stops: [] }],
    };
    const moved = applyPosition(day, { runId: 'run-1', deliveryDate: '2026-09-28', position: { latitude: 1, longitude: 2 } });
    expect(moved.runs[0]).toEqual(expect.objectContaining({ stale: false, ageSeconds: 0, lastPosition: { latitude: 1, longitude: 2 } }));
    expect(applyPosition(day, { runId: 'run-1', deliveryDate: '2026-09-27', position: { latitude: 1, longitude: 2 } })).toBe(day);
    expect(applyPosition(day, { runId: 'other', position: { latitude: 1, longitude: 2 } })).toBe(day);
  });
});

describe('Reconciliation', () => {
  const day: IReconDay = {
    date: '2026-09-28',
    runs: [reconRun()],
    total: { runs: 1, stopsDone: 2, stopsTotal: 2, quantities: qty(), money: cash(), basketsReturned: 4, handoversClosed: 1, discrepancies: 1, unexplained: 1 },
    factories: [],
  };

  it('shows the day totals and a run with its discrepancies', async () => {
    jest.mocked(fetchReconciliation).mockResolvedValue(day);
    jest.mocked(fetchReconciliationRun).mockResolvedValue({
      run: reconRun(),
      products: [{ itemId: 'bread', name: 'White Bread', ordered: 20, approved: 18, delivered: 17, staleReturned: 2 }],
      discrepancies: [
        { orderId: 'o-1', stopSequence: 1, customerName: 'Corner Cafe', itemId: 'bread', name: 'White Bread', approved: 18, delivered: 17, difference: -1, type: 'UNEXPLAINED' },
      ],
    });
    renderPage(<Reconciliation />);

    expect((await screen.findByTestId('stat-Invoiced')).textContent).toContain('$100.00');
    expect(screen.getByTestId('stat-Handover difference').textContent).toContain('-$2.00');
    expect(screen.getByTestId('stat-Quantity changes').textContent).toContain('1');
    const row = within(screen.getByTestId('recon-runs')).getByText('Windsor North');
    fireEvent.click(row);

    const detail = await screen.findByTestId('recon-detail');
    expect(within(detail).getByText('Checks not handed in: #1002')).toBeTruthy();
    expect(within(screen.getByTestId('recon-discrepancies')).getByText('No reason')).toBeTruthy();
    expect(fetchReconciliationRun).toHaveBeenCalledWith('run-1');
  });
});

describe('Alerts', () => {
  it('lists open alerts and acknowledges one with a note', async () => {
    jest.mocked(fetchAlerts).mockResolvedValue([
      { id: 'a-1', type: 'CASH_NOT_RECEIVED', status: 'OPEN', deliveryDate: '2026-09-28', runName: 'Windsor North', amount: 2, message: 'Cash short by $2.00' },
    ]);
    jest.mocked(acknowledgeAlert).mockResolvedValue({ id: 'a-1', type: 'CASH_NOT_RECEIVED', status: 'ACKNOWLEDGED' });
    renderPage(<Alerts />);

    expect(await screen.findByText('Cash short by $2.00')).toBeTruthy();
    expect(fetchAlerts).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    fireEvent.change(await screen.findByLabelText('Note'), { target: { value: 'Driver paid it back' } });
    const dialog = screen.getByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Acknowledge' }));

    await waitFor(() => expect(acknowledgeAlert).toHaveBeenCalledWith('a-1', 'Driver paid it back'));
  });
});

describe('Customer Accounts', () => {
  const account: ICustomerAccount = {
    customerId: 'c-1',
    customerName: 'Corner Cafe',
    asOf: '2026-09-28',
    aging: aging({ total: 70, current: 30, days1to30: 40, days90plus: 0 }),
    openInvoices: [invoice(), invoice({ orderId: 'o-2', billId: 'b-2', invoiceNumber: 1002, invoiceDate: '2026-09-25', open: 30, total: 30 })],
    openMemos: [{ id: 'm-1', number: 7, reason: 'STALE_RETURN', status: 'OPEN', total: 5, remaining: 5 }],
    openCredit: 5,
    recentPayments: [],
    onAccountEnabled: false,
  };

  it('opens a customer from the aging list and receives a payment split oldest first', async () => {
    jest.mocked(fetchAging).mockResolvedValue({
      asOf: '2026-09-28',
      customers: [{ customerId: 'c-1', customerName: 'Corner Cafe', aging: account.aging, openInvoices: 2, oldestOpenInvoiceDate: '2026-09-01', openCredit: 5 }],
      total: account.aging,
      openCredit: 5,
    });
    jest.mocked(fetchAccount).mockResolvedValue(account);
    jest.mocked(receivePayment).mockResolvedValue({ id: 'p-1', amount: 50 });
    renderPage(<CustomerAccounts />);

    fireEvent.click(await within(await screen.findByTestId('aging')).findByText('Corner Cafe'));
    expect((await screen.findByTestId('account-total')).textContent).toContain('$70.00');
    expect(within(screen.getByTestId('open-memos')).getByText('Credit memo #7')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Receive payment' }));
    fireEvent.change(await screen.findByLabelText('Amount'), { target: { value: '50' } });
    expect(screen.getByLabelText<HTMLInputElement>('Pay on #1001').value).toBe('40');
    expect(screen.getByLabelText<HTMLInputElement>('Pay on #1002').value).toBe('10');
    fireEvent.change(screen.getByLabelText('Check number'), { target: { value: '5511' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save payment' }));

    await waitFor(() =>
      expect(receivePayment).toHaveBeenCalledWith(
        'c-1',
        expect.objectContaining({
          method: 'CHECK',
          amount: 50,
          checkNumber: '5511',
          allocations: [
            { orderId: 'o-1', billId: 'b-1', amount: 40 },
            { orderId: 'o-2', billId: 'b-2', amount: 10 },
          ],
        }),
      ),
    );
  });

  it('shows the statement with the closing balance', async () => {
    jest.mocked(fetchAging).mockResolvedValue({ asOf: '2026-09-28', customers: [], total: aging(), openCredit: 0 });
    jest.mocked(fetchAccount).mockResolvedValue(account);
    jest.mocked(fetchStatement).mockResolvedValue({
      customerId: 'c-1',
      customerName: 'Corner Cafe',
      from: '2026-07-01',
      to: '2026-09-28',
      openingBalance: 0,
      lines: [{ date: '2026-09-01', type: 'INVOICE', reference: '#1001', debit: 40, credit: 0, balance: 40 }],
      totalDebit: 40,
      totalCredit: 0,
      closingBalance: 40,
      openMemos: [],
    });
    renderPage(<CustomerAccounts />, undefined, '/?customer=c-1');

    fireEvent.click(await screen.findByRole('tab', { name: 'Statement' }));
    expect((await screen.findByTestId('closing-balance')).textContent).toContain('$40.00');
    expect(fetchStatement).toHaveBeenCalledWith('c-1', expect.any(String), expect.any(String));
  });
});

describe('Invoices', () => {
  it('lists invoices with totals, status and a reprint link', async () => {
    jest.mocked(fetchInvoiceList).mockResolvedValue({
      from: '2026-09-01',
      to: '2026-09-28',
      rows: [{ ...invoice(), status: 'PARTLY_PAID', paid: 10, open: 30 }],
      page: 0,
      size: 50,
      totalRows: 1,
      totals: { count: 1, total: 40, paid: 10, onAccountCharged: 0, open: 30 },
    });
    renderPage(<Invoices />);

    const list = await screen.findByTestId('invoice-list');
    expect(await within(list).findByText('#1001')).toBeTruthy();
    expect(within(list).getByText('Partly paid')).toBeTruthy();
    expect(within(list).getByRole('link', { name: 'Print' }).getAttribute('href')).toBe('/order/o-1/print/b-1');
    expect(screen.getByTestId('stat-Open').textContent).toContain('$30.00');
  });
});

describe('Live Route', () => {
  it('marks drivers who stopped reporting and shows the selected run stops', async () => {
    jest.mocked(fetchLiveRoute).mockResolvedValue({
      date: '2026-09-28',
      intervalSeconds: 60,
      runs: [
        {
          run: { id: 'run-1', name: 'Windsor North', deliveryDate: '2026-09-28', driverUsername: 'dana', locked: false, stopsDone: 1, stopsTotal: 2 },
          lastPosition: { latitude: 42.3, longitude: -83, recordedAt: '2026-09-28T09:00:00Z' },
          ageSeconds: 600,
          stale: true,
          stops: [{ sequence: 1, orderId: 'o-1', businessName: 'Corner Cafe', status: 'VISITED', latitude: 42.31, longitude: -83.01 }],
        },
      ],
    });
    jest.mocked(fetchTrail).mockResolvedValue({ runId: 'run-1', points: [] });
    renderPage(<LiveRoute />);

    const runs = await screen.findByTestId('live-runs');
    expect(await within(runs).findByText(/Not reporting/)).toBeTruthy();
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
    fireEvent.click(within(runs).getByText('Windsor North'));
    await waitFor(() => expect(fetchTrail).toHaveBeenCalledWith('run-1'));
    expect(screen.getByText('1. Corner Cafe (done)')).toBeTruthy();
  });
});

describe('Dashboard', () => {
  const dashboard: IDashboard = {
    from: '2026-09-28',
    to: '2026-09-28',
    orders: { count: 12, customers: 10, value: 480 },
    quantities: qty(),
    staleRatePercent: 11.76,
    money: cash(),
    runs: { total: 3, notStarted: 1, inProgress: 1, submitted: 1, stopsDone: 10, stopsTotal: 20, handoversClosed: 1 },
    shortages: { factoryOrders: 1, lines: 2, quantity: 6 },
    openAlerts: 4,
    receivables: { total: 900, overdue: 300, openCredit: 12, customers: 8 },
    topStaleCustomers: [{ customerId: 'c-1', customerName: 'Corner Cafe', delivered: 50, staleReturned: 10, ratePercent: 20 }],
    trend: [],
  };

  it('shows the headline numbers and links only to pages the user can open', async () => {
    jest.mocked(fetchDashboard).mockResolvedValue(dashboard);
    renderPage(<Dashboard />, [AUTHORITIES.WHOLESALE_SALES_MANAGER]);

    expect((await screen.findByTestId('stat-Orders')).textContent).toContain('12');
    expect(screen.getByTestId('stat-Stale rate').textContent).toContain('11.8%');
    expect(screen.getByTestId('stat-Open alerts').textContent).toContain('4');
    expect(screen.getByTestId('stat-Open alerts').closest('a')).toBeNull();
    expect(screen.getByTestId('stat-Runs').closest('a').getAttribute('href')).toBe('/logistics/delivery-runs');
    expect(within(screen.getByTestId('stale-customers')).getByText('20.0%')).toBeTruthy();
  });

  it('asks for a shorter range instead of calling the server', async () => {
    jest.mocked(fetchDashboard).mockResolvedValue(dashboard);
    renderPage(<Dashboard />);
    await screen.findByTestId('stat-Orders');
    jest.mocked(fetchDashboard).mockClear();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-07-01' } });
    expect(await screen.findByText('Choose a range of 31 days or less.')).toBeTruthy();
    expect(fetchDashboard).not.toHaveBeenCalled();
  });
});
