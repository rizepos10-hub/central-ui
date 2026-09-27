import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleClosures from './closures';
import { fetchClosures, fetchRouteDeliveryDays, saveClosure } from './closure.api';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { fetchRouteDefinitions, fetchWholesaleCustomer } from '../customers/wholesale-customer.api';
import { IWholesaleClosure, buildRouteMarks, formatDay, monthGrid, toClosurePayload, validateClosure } from './closure.model';

jest.mock('./closure.api', () => ({
  fetchClosures: jest.fn(),
  saveClosure: jest.fn(),
  deleteClosure: jest.fn(),
  fetchRouteDeliveryDays: jest.fn(),
}));
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn() }));
jest.mock('../customers/wholesale-customer.api', () => ({
  fetchRouteDefinitions: jest.fn(),
  fetchWholesaleCustomer: jest.fn(),
  fetchWholesaleCustomers: jest.fn().mockResolvedValue({ items: [], total: 0 }),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const holiday: IWholesaleClosure = { id: 'cl-1', scope: 'BUSINESS', fromDate: '2026-11-11', toDate: '2026-11-11', action: 'SKIP', reason: 'Holiday' };

const renderPage = (authorities: string[]) => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <WholesaleClosures />
    </Provider>,
  );
};

const cell = (day: string): HTMLElement => document.querySelector(`[data-day="${day}"]`);

describe('closure model', () => {
  it('builds six Monday-first weeks', () => {
    const days = monthGrid(2026, 10);
    expect(days).toHaveLength(42);
    expect(days[0]).toBe('2026-10-26');
    expect(days[6]).toBe('2026-11-01');
  });

  it('checks scope, dates and the move day like the server', () => {
    expect(validateClosure({ scope: 'ROUTE', fromDate: '2026-11-11', toDate: '2026-11-11' }).scopeId).toBe('Choose the route the closure applies to');
    expect(validateClosure({ scope: 'BUSINESS', fromDate: '2026-11-12', toDate: '2026-11-11' }).dates).toBe('The end date is before the start date');
    expect(validateClosure({ scope: 'BUSINESS', fromDate: '2026-11-11', toDate: '2026-11-13', action: 'MOVE', moveToDate: '2026-11-12' }).moveToDate).toBe(
      'Deliveries cannot be moved to a day inside the same closure',
    );
    expect(validateClosure({ scope: 'BUSINESS', fromDate: '2026-11-11', toDate: '2026-11-11', action: 'MOVE', moveToDate: '2026-11-12' })).toEqual({});
  });

  it('sends no scope id for the whole business and no move day when skipping', () => {
    expect(toClosurePayload({ scope: 'BUSINESS', scopeId: 'x', fromDate: '2026-11-11', toDate: '', action: 'SKIP', moveToDate: '2026-11-12', reason: ' ' })).toEqual({
      id: undefined,
      scope: 'BUSINESS',
      scopeId: null,
      fromDate: '2026-11-11',
      toDate: '2026-11-11',
      action: 'SKIP',
      moveToDate: null,
      reason: null,
    });
  });

  it('marks a moved delivery on both days', () => {
    const marks = buildRouteMarks([{ route: { id: 'r-1', name: 'North' }, days: [{ date: '2026-11-11', status: 'MOVED', deliveryDate: '2026-11-12' }] }]);
    expect(marks['2026-11-11'][0]).toMatchObject({ status: 'MOVED', otherDate: '2026-11-12' });
    expect(marks['2026-11-12'][0]).toMatchObject({ status: 'MOVED_IN', otherDate: '2026-11-11' });
  });
});

describe('Closures page', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2026, 10, 10, 9, 0),
      doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'],
    });
  });
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([]);
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([
      { id: 'r-1', name: 'North', active: true },
      { id: 'r-2', name: 'East', active: true },
    ]);
    jest.mocked(fetchClosures).mockResolvedValue([holiday]);
    jest.mocked(fetchRouteDeliveryDays).mockImplementation(routeId =>
      Promise.resolve(
        routeId === 'r-1'
          ? [
              { date: '2026-11-04', status: 'DELIVER' },
              { date: '2026-11-11', status: 'SKIPPED', closureIds: ['cl-1'] },
            ]
          : [{ date: '2026-11-11', status: 'MOVED', deliveryDate: '2026-11-12', closureIds: ['cl-1'] }],
      ),
    );
    jest.mocked(saveClosure).mockReset();
  });

  it("shows a holiday on the affected routes' days", async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    expect(await within(cell('2026-11-11')).findByText('Holiday (Everyone)')).toBeTruthy();
    expect(await within(cell('2026-11-11')).findByText('North skipped')).toBeTruthy();
    expect(within(cell('2026-11-11')).getByText(`East moved to ${formatDay('2026-11-12')}`)).toBeTruthy();
    expect(within(cell('2026-11-12')).getByText(`East (from ${formatDay('2026-11-11')})`)).toBeTruthy();
    expect(within(cell('2026-11-04')).getByText('North')).toBeTruthy();
    expect(fetchClosures).toHaveBeenCalledWith('2026-10-26', '2026-12-06');

    fireEvent.click(screen.getByText('list'));
    expect(await screen.findByText('North, East')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
  });

  it('adds a closure that moves deliveries', async () => {
    jest.mocked(saveClosure).mockResolvedValue({ ...holiday, id: 'cl-2' });
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await within(cell('2026-11-11')).findByText('Holiday (Everyone)');

    fireEvent.click(cell('2026-11-26'));
    await screen.findByRole('dialog');
    expect(screen.getByLabelText<HTMLInputElement>('From').value).toBe('2026-11-26');
    fireEvent.click(screen.getByText('Move deliveries'));
    fireEvent.change(screen.getByLabelText('Move to'), { target: { value: '2026-11-26' } });
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Deliveries cannot be moved to a day inside the same closure')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Move to'), { target: { value: '2026-11-27' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Thanksgiving' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(saveClosure).toHaveBeenCalledWith({
        id: undefined,
        scope: 'BUSINESS',
        scopeId: null,
        fromDate: '2026-11-26',
        toDate: '2026-11-26',
        action: 'MOVE',
        moveToDate: '2026-11-27',
        reason: 'Thanksgiving',
      }),
    );
  });

  it('is read only for bookkeepers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    await within(cell('2026-11-11')).findByText('Holiday (Everyone)');
    expect(screen.queryByText('New closure')).toBeNull();
    fireEvent.click(cell('2026-11-26'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(within(cell('2026-11-11')).getByText('Holiday (Everyone)'));
    expect(await screen.findByText(/deliveries are skipped/)).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('loads the next month', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await within(cell('2026-11-11')).findByText('Holiday (Everyone)');
    fireEvent.click(screen.getByLabelText('Next month'));
    await waitFor(() => expect(fetchClosures).toHaveBeenCalledWith('2026-11-30', '2027-01-10'));
  });

  it("drops the last month's closures when the next month fails to load", async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await within(cell('2026-11-11')).findByText('Holiday (Everyone)');
    jest.mocked(fetchClosures).mockRejectedValueOnce(new Error('down'));

    fireEvent.click(screen.getByLabelText('Next month'));

    await waitFor(() => expect(fetchClosures).toHaveBeenCalledWith('2026-11-30', '2027-01-10'));
    await waitFor(() => expect(screen.queryByText('Holiday (Everyone)')).toBeNull());
  });

  it('ignores a slow answer for the month the user already left', async () => {
    let answerNovember: (list: IWholesaleClosure[]) => void;
    jest.mocked(fetchClosures).mockImplementation(from =>
      from === '2026-10-26' ? new Promise(resolve => (answerNovember = resolve)) : Promise.resolve([]),
    );
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    fireEvent.click(screen.getByLabelText('Next month'));
    await waitFor(() => expect(fetchClosures).toHaveBeenCalledWith('2026-11-30', '2027-01-10'));

    await act(async () => {
      answerNovember([{ ...holiday, fromDate: '2026-12-02', toDate: '2026-12-02' }]);
      await Promise.resolve();
    });

    expect(within(cell('2026-12-02')).queryByText('Holiday (Everyone)')).toBeNull();
  });

  it("names the customer in the editor once the customer's name arrives", async () => {
    let answerCustomer: (customer: object) => void;
    jest.mocked(fetchWholesaleCustomer).mockReturnValue(new Promise(resolve => (answerCustomer = resolve)) as never);
    jest.mocked(fetchClosures).mockResolvedValue([{ ...holiday, scope: 'CUSTOMER', scopeId: 'c-1' }]);
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);

    fireEvent.click(await within(cell('2026-11-11')).findByText('Holiday (Customer)'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('c-1')).toBeTruthy();

    answerCustomer({ id: 'c-1', businessName: 'Corner Cafe' });

    expect(await within(dialog).findByText('Corner Cafe')).toBeTruthy();
  });
});
