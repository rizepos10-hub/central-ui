import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

import { downloadElementAsPdf, saveWorkbookAsExcel } from 'app/shared/util/report-export-utils';
import InventoryReport from './inventory-report';

const mockDispatch = jest.fn();
const mockState = {
  inventoryItem: {
    errorMessage: null,
    entities: [
      {
        id: '1',
        name: 'Burger',
        variants: [
          {
            id: 'v1',
            name: 'Regular',
            attributeValues: [],
            price: 10,
            stockQuantities: [],
          },
        ],
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

describe('InventoryReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the full filtered dataset before exporting pdf', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          name: 'Burger',
          variants: [
            {
              id: 'v1',
              name: 'Regular',
              attributeValues: [],
              price: 10,
              stockQuantities: [],
            },
          ],
        },
      ],
      headers: { 'x-total-count': '1' },
    } as any);

    render(<InventoryReport />);

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api/inventory/items?page=0&size=100'));
    expect(screen.getByTestId('report-export-header')).not.toBeNull();
  });

  it('exports excel from the inventory report dataset instead of the retail product export thunk', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          name: 'Burger',
          variants: [
            {
              id: 'v1',
              name: 'Regular',
              attributeValues: [],
              price: 10,
              stockQuantities: [
                {
                  location: { name: 'Main', type: 'STORE' },
                  quantity: 3,
                  unitCost: 4,
                },
              ],
            },
          ],
        },
      ],
      headers: { 'x-total-count': '1' },
    } as any);

    render(<InventoryReport />);

    fireEvent.click(screen.getByTestId('report-action-excel'));

    await waitFor(() => {
      expect(mockedSaveWorkbookAsExcel).toHaveBeenCalledTimes(1);
    });

    const workbook = mockedSaveWorkbookAsExcel.mock.calls[0][0];
    expect(workbook.sheets[0].rows).toEqual(
      expect.arrayContaining([
        ['Item', 'Variant', 'Price', 'Location', 'Location Type', 'Quantity', 'Unit Cost'],
        ['Burger', 'Regular', '10', 'Main', 'STORE', '3', '4'],
      ])
    );
  });

  it('stops export paging when the backend repeats the same full inventory page', async () => {
    const repeatedPage = {
      data: [
        {
          id: '1',
          name: 'Burger',
          variants: [],
        },
        {
          id: '2',
          name: 'Pizza',
          variants: [],
        },
      ],
      headers: { 'x-total-count': '10' },
    } as any;

    mockedAxios.get.mockResolvedValueOnce(repeatedPage).mockResolvedValueOnce(repeatedPage);

    render(<InventoryReport />);

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('shows a visible export error when the inventory export api fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<InventoryReport />);

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(screen.getByTestId('inventory-report-error')).not.toBeNull();
    });

    expect(mockedDownloadElementAsPdf).not.toHaveBeenCalled();
  });
});
