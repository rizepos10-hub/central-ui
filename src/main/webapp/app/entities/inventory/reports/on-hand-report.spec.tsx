import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

import { downloadElementAsPdf, saveWorkbookAsExcel } from 'app/shared/util/report-export-utils';
import OnHandReport from './on-hand-report';

const mockDispatch = jest.fn();
const mockPrint = jest.fn();
const mockState = {
  branch: {
    entities: [{ id: 'branch-1', name: 'Main Branch', timezone: 'UTC' }],
  },
  supplier: {
    entities: [{ id: 'supplier-1', name: 'Supplier 1' }],
  },
  businessDetail: {
    entities: [{ businessName: 'KL TRADING LLC' }],
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('axios');

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => mockPrint),
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
    saveWorkbookAsExcel: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('app/shared/components/select/select', () => ({
  __esModule: true,
  default: ({ options, onChange, placeholder }) => (
    <div>
      <div>{placeholder}</div>
      <button type="button" onClick={() => onChange(null)}>
        Clear category
      </button>
      {options.map(option => (
        <button key={option.value} type="button" onClick={() => onChange(option)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext({ onValueChange: (_value: string) => undefined });

  return {
    Select: ({ children, onValueChange }) => (
      <SelectContext.Provider value={{ onValueChange }}>{children}</SelectContext.Provider>
    ),
    SelectTrigger: ({ children, className }) => <div className={className}>{children}</div>,
    SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
    SelectContent: ({ children }) => <div>{children}</div>,
    SelectItem: ({ children, value, className }) => {
      const context = React.useContext(SelectContext);
      return (
        <button type="button" className={className} onClick={() => context.onValueChange(value)}>
          {children}
        </button>
      );
    },
  };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className }) => <label className={className}>{children}</label>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, className }) => <table className={className}>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children, className }) => <tr className={className}>{children}</tr>,
  TableHead: ({ children, className }) => <th className={className}>{children}</th>,
  TableCell: ({ children, className, colSpan }) => (
    <td className={className} colSpan={colSpan}>
      {children}
    </td>
  ),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
const mockedSaveWorkbookAsExcel = saveWorkbookAsExcel as jest.MockedFunction<typeof saveWorkbookAsExcel>;

const baseCategoryResponse = {
  data: [{ id: 'category-1', name: 'Category 1' }],
  headers: { 'x-total-count': '1' },
} as any;

const variantRow = {
  id: 'variant-1',
  sku: 'SKU-1',
  itemName: 'Rice Bag',
  stockQuantities: [{ quantity: 3, unitCost: 5, location: { branch: { id: 'branch-1' } } }],
  allocatedQuantity: 2,
  onHandWeight: null,
  valueAtCost: null,
  valueAtLevel1: null,
};

describe('OnHandReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === 'api/_search/retail-categories') {
        return Promise.resolve(baseCategoryResponse);
      }

      return Promise.resolve({ data: [] } as any);
    });
  });

  it('does not fetch report data until a branch is selected', async () => {
    render(<OnHandReport />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('api/_search/retail-categories', expect.anything());
    });

    expect(mockedAxios.get).not.toHaveBeenCalledWith('api/_search/variants', expect.anything());
    expect(screen.getByText('Select a branch to load the on hand report.')).not.toBeNull();
    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(true);
  });

  it('fetches the report with branch, optional filters, and empty name param', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === 'api/_search/retail-categories') {
        return Promise.resolve(baseCategoryResponse);
      }

      if (url === 'api/_search/variants') {
        return Promise.resolve({ data: [variantRow] } as any);
      }

      return Promise.resolve({ data: [] } as any);
    });

    render(<OnHandReport />);

    fireEvent.click(screen.getByText('Supplier 1'));
    fireEvent.click(screen.getByText('Category 1'));
    fireEvent.click(screen.getByText('Main Branch'));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('api/_search/variants', {
        params: {
          branchId: 'branch-1',
          supplierId: 'supplier-1',
          categoryId: 'category-1',
          name: '',
        },
      });
    });
  });

  it('maps cost base from unit cost, cost real from quantity, and does not derive unclear columns', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === 'api/_search/retail-categories') {
        return Promise.resolve(baseCategoryResponse);
      }

      if (url === 'api/_search/variants') {
        return Promise.resolve({
          data: [
            variantRow,
            {
              id: 'variant-2',
              sku: 'SKU-2',
              itemName: 'Sugar Bag',
              stockQuantities: [{ quantity: 5, unitCost: 10, location: { branch: { id: 'branch-1' } } }],
              allocatedQuantity: 1,
              onHandWeight: 7,
              valueAtCost: 50,
              valueAtLevel1: 60,
            },
          ],
        } as any);
      }

      return Promise.resolve({ data: [] } as any);
    });

    render(<OnHandReport />);
    fireEvent.click(screen.getByText('Main Branch'));

    expect(await screen.findByText('Totals:')).not.toBeNull();
    expect(screen.getByText('Cost: Real')).not.toBeNull();
    expect(screen.getByText('15.00')).not.toBeNull();
    expect(screen.getByText('65.00')).not.toBeNull();
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('report-action-excel'));

    await waitFor(() => {
      expect(mockedSaveWorkbookAsExcel).toHaveBeenCalledTimes(1);
    });

    const workbook = mockedSaveWorkbookAsExcel.mock.calls[0][0];
    expect(workbook.sheets[0].rows).toEqual(
      expect.arrayContaining([
        [
          'Item Number',
          'Description',
          'Cost Base',
          'Cost Real',
          'Allocated Quantity',
          'On Hand Quantity',
          'On Hand Weight',
          'Value At Cost',
          'Value At Level 1',
        ],
        ['SKU-1', 'Rice Bag', '5', '15', '2', '3', '0', '0', '0'],
      ])
    );
  });

  it('supports pdf and print exports after data loads', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === 'api/_search/retail-categories') {
        return Promise.resolve(baseCategoryResponse);
      }

      if (url === 'api/_search/variants') {
        return Promise.resolve({ data: [variantRow] } as any);
      }

      return Promise.resolve({ data: [] } as any);
    });

    render(<OnHandReport />);
    fireEvent.click(screen.getByText('Main Branch'));

    expect(await screen.findByText('Totals:')).not.toBeNull();

    fireEvent.click(screen.getByTestId('report-action-pdf'));
    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('report-action-print'));
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });
});
