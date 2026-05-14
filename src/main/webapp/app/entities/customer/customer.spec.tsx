import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

import { downloadElementAsPdf, saveWorkbookAsExcel } from 'app/shared/util/report-export-utils';
import Customer from './customer';

const mockDispatch = jest.fn();
const mockState = {
  customer: {
    entities: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '111',
        accountNumber: 'ACC-1',
        businessDetails: { businessName: 'Acme' },
        onAccountEnabled: true,
        onAccountDebitLimit: 150,
        onAccountDebitUsed: 25,
      },
    ],
    loading: false,
    totalItems: 1,
  },
  businessDetail: {
    entities: [
      {
        businessName: 'Maza Foods',
        logo: { url: 'https://example.com/logo.png' },
      },
    ],
    loading: false,
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('axios');

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
    saveWorkbookAsExcel: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
const mockedSaveWorkbookAsExcel = saveWorkbookAsExcel as jest.MockedFunction<typeof saveWorkbookAsExcel>;

describe('Customer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the full filtered customer dataset to excel', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: mockState.customer.entities,
      headers: { 'x-total-count': '1' },
    } as any);

    const query = encodeURIComponent(
      JSON.stringify({
        first: 0,
        rows: 20,
        page: 0,
        sortField: 'accountNumber',
        sortOrder: 1,
        query: '',
        filters: {
          firstName: { value: 'John', matchMode: 'contains' },
          email: { value: null, matchMode: 'contains' },
          phone: { value: null, matchMode: 'contains' },
          accountNumber: { value: 'ACC', matchMode: 'contains' },
          'businessDetails.businessName': { value: null, matchMode: 'contains' },
          onAccountEnabled: { value: true, matchMode: 'equals' },
        },
      })
    );

    render(
      <MemoryRouter initialEntries={[`/customer?query=${query}`]}>
        <Customer />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('report-action-excel'));

    await waitFor(() => {
      expect(mockedSaveWorkbookAsExcel).toHaveBeenCalledTimes(1);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'api/_search/customers',
      expect.objectContaining({
        first: 0,
        page: 0,
        rows: 250,
        sortField: 'accountNumber',
        sortOrder: 1,
      })
    );

    const workbook = mockedSaveWorkbookAsExcel.mock.calls[0][0];
    expect(workbook.sheets[0].rows).toEqual(
      expect.arrayContaining([
        ['Name', 'Email', 'Phone', 'Account Number', 'Business Name', 'On Account', 'Debit Limit', 'Debit Used'],
        ['John Doe', 'john@example.com', '111', 'ACC-1', 'Acme', 'Active', '150.00', '25.00'],
      ])
    );
  });

  it('fetches the full filtered customer dataset before exporting pdf', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: mockState.customer.entities,
      headers: { 'x-total-count': '1' },
    } as any);

    render(
      <MemoryRouter>
        <Customer />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'api/_search/customers',
      expect.objectContaining({
        first: 0,
        page: 0,
        rows: 250,
      })
    );

    expect(screen.getByTestId('report-export-header')).not.toBeNull();
  });

  it('shows an export error when customer export fetching fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <MemoryRouter>
        <Customer />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(screen.getByTestId('customer-export-error')).not.toBeNull();
    });

    expect(mockedDownloadElementAsPdf).not.toHaveBeenCalled();
  });
});
