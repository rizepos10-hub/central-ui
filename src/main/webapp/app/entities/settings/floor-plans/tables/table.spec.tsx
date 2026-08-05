import React from 'react';
import axios from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import { useReactToPrint } from 'react-to-print';
import FloorPlanTable from './table';

const mockDispatch = jest.fn();
const mockPrint = jest.fn();
const mockState = {
  floorPlanTable: {
    entities: [
      {
        id: 'table-1',
        name: 'Table 1',
        branch: { id: 'branch-1', name: 'Main Branch' },
        dimensions: { width: 120, height: 60 },
        image: null,
      },
    ],
    loading: false,
    totalItems: 1,
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('axios');

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(),
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUseReactToPrint = useReactToPrint as jest.MockedFunction<typeof useReactToPrint>;
const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

describe('FloorPlanTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedUseReactToPrint.mockReturnValue(mockPrint);
    mockedAxios.get.mockResolvedValue({
      data: {
        domain: 'https://storefront.example.com',
      },
    });
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <FloorPlanTable />
      </MemoryRouter>
    );

  it('copies the selected table URL from the QR dialog', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /qr/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText('https://storefront.example.com/branch-1?tableMode=true&tables=Table+1')
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByTestId('table-qr-copy'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://storefront.example.com/branch-1?tableMode=true&tables=Table+1'
      );
    });
  });

  it('uses the browser print flow for the selected table QR page', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /qr/i }));
    fireEvent.click(screen.getByTestId('table-qr-print'));

    expect(mockedUseReactToPrint).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });

  it('exports the selected table QR page through the shared pdf helper', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /qr/i }));
    fireEvent.click(screen.getByTestId('table-qr-export-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(mockedDownloadElementAsPdf.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    expect((mockedDownloadElementAsPdf.mock.calls[0][0] as HTMLElement).className).toContain('table-qr-print-page');
    expect(mockedDownloadElementAsPdf.mock.calls[0][1]).toMatchObject({
      fileName: 'table-qr-table-1',
      orientation: 'portrait',
    });
  });
});
