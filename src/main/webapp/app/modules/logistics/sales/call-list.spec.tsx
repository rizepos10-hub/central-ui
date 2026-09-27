import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import CallList from './call-list';
import { CallListBadge } from './call-list-badge';
import { CALL_LOGGED_EVENT } from './log-call-dialog';
import { fetchCallList, fetchCallListCount, fetchCallLogs, logCall } from './sales.api';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { ICallListEntry } from './sales.model';

jest.mock('./sales.api', () => ({
  fetchCallList: jest.fn(),
  fetchCallListCount: jest.fn(),
  fetchCallLogs: jest.fn(),
  logCall: jest.fn(),
  createCustomerNote: jest.fn(),
}));

jest.mock('../customers/wholesale-customer.api', () => ({
  fetchRouteDefinitions: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const entry = (id: string, name: string, patch: Partial<ICallListEntry> = {}): ICallListEntry => ({
  customerId: id,
  name,
  routeId: 'r-1',
  stopSequence: 1,
  orderIds: [],
  pending: true,
  callCount: 0,
  ...patch,
});

describe('Call List page', () => {
  beforeEach(() => {
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([{ id: 'r-1', name: 'North', active: true }]);
    jest.mocked(fetchCallList).mockReset().mockResolvedValue([
      entry('c-1', 'Corner Cafe', { phone: '555-0101' }),
      entry('c-2', 'Deli Two', { stopSequence: 2, pending: false, lastOutcome: 'CALL_BACK', callCount: 2, lastCalledBy: 'sam' }),
    ]);
    jest.mocked(fetchCallLogs).mockResolvedValue([]);
    jest.mocked(logCall).mockReset().mockResolvedValue({ id: 'l-1', customerId: 'c-1', deliveryDate: '2026-10-06', outcome: 'NO_ANSWER' });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/logistics/call-list?date=2026-10-06']}>
        <CallList />
      </MemoryRouter>,
    );

  it('lists customers with their status and links to order entry', async () => {
    renderPage();
    expect(await screen.findByText('Corner Cafe')).toBeTruthy();
    expect(fetchCallList).toHaveBeenCalledWith({ date: '2026-10-06', routeId: undefined, includeDone: false });
    expect(screen.getByText('To call')).toBeTruthy();
    expect(screen.getByText('Call back')).toBeTruthy();
    expect(screen.getByText(/by sam \(2 calls\)/)).toBeTruthy();
    const links = screen.getAllByText('Take order');
    expect(links[0].getAttribute('href')).toBe('/logistics/order-entry?date=2026-10-06&customerId=c-1&from=call-list');
  });

  it('logs a call, tells the menu badge and reloads', async () => {
    const heard = jest.fn();
    window.addEventListener(CALL_LOGGED_EVENT, heard);
    renderPage();
    await screen.findByText('Corner Cafe');
    fireEvent.click(screen.getAllByText('Log call')[0]);
    fireEvent.change(await screen.findByLabelText('Call notes'), { target: { value: ' rang twice ' } });
    fireEvent.click(screen.getAllByText('Log call').pop());

    await waitFor(() => expect(logCall).toHaveBeenCalledTimes(1));
    expect(logCall).toHaveBeenCalledWith({ customerId: 'c-1', deliveryDate: '2026-10-06', outcome: 'NO_ANSWER', followUpAt: null, notes: 'rang twice' });
    await waitFor(() => expect(fetchCallList).toHaveBeenCalledTimes(2));
    expect(heard).toHaveBeenCalled();
    window.removeEventListener(CALL_LOGGED_EVENT, heard);
  });
});

describe('Call List badge', () => {
  it('shows the pending count and refreshes after a call is logged', async () => {
    jest.mocked(fetchCallListCount).mockReset().mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    render(<CallListBadge />);
    expect(await screen.findByText('3')).toBeTruthy();
    act(() => {
      window.dispatchEvent(new Event(CALL_LOGGED_EVENT));
    });
    await waitFor(() => expect(screen.queryByText('3')).toBeNull());
    expect(fetchCallListCount).toHaveBeenCalledTimes(2);
  });
});
