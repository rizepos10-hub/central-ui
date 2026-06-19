import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Barcode from './barcode'

const mockDispatch = jest.fn()
const mockNavigate = jest.fn()

let mockState: any
let mockSearchParams = new URLSearchParams('?rows=25')

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(mockState),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

jest.mock('../product/product.reducer', () => ({
  filterEntities: jest.fn(payload => ({ type: 'product/filter_entity_list', payload })),
}))

jest.mock('app/shared/components/pagination/pagination-filter', () => () => null)
jest.mock('app/shared/components/filter/drop-down-filter', () => () => null)

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
}))

jest.mock('react-barcode', () => ({
  __esModule: true,
  default: ({ value, displayValue }: { value: string; displayValue?: boolean }) => (
    <div data-testid={`mock-barcode-${value}`}>
      <div>BARCODE:{value}</div>
      {displayValue ? <div>VALUE:{value}</div> : null}
    </div>
  ),
}))

jest.mock('react-select', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, placeholder }: any) => (
    <select
      aria-label={placeholder || 'select'}
      value={value?.value ?? ''}
      onChange={event => {
        const nextOption = options.find((option: any) => String(option.value) === event.target.value)
        onChange?.(nextOption ?? null)
      }}
    >
      <option value="">{placeholder || 'select'}</option>
      {options.map((option: any) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={!!checked}
      onChange={event => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

const buildVariant = (overrides: Record<string, any> = {}) => ({
  id: 'variant-1',
  name: 'MANHA 2PC DRESS',
  sku: 'SKU-001',
  price: 60,
  salePrice: null,
  attributeValues: {
    color: { name: 'Purple' },
    accent: { name: 'Yellow' },
  },
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockSearchParams = new URLSearchParams('?rows=25')
  mockState = {
    product: {
      entities: [
        {
          id: 'product-1',
          variants: [buildVariant()],
        },
      ],
      totalItems: 1,
    },
  }
})

const renderBarcodePage = () => render(<Barcode />)

const openPreviewWithSelection = () => {
  renderBarcodePage()
  fireEvent.click(screen.getByLabelText('Select All'))
  fireEvent.click(screen.getByRole('button', { name: 'Print' }))
}

describe('Barcode page', () => {
  it('shows formatted currency prices in preview and print by default', () => {
    openPreviewWithSelection()

    const preview = screen.getByTestId('barcode-preview-variant-1')
    const print = screen.getByTestId('barcode-print-variant-1')

    expect(within(preview).getByText('$60.00')).not.toBeNull()
    expect(within(print).getByText('$60.00')).not.toBeNull()
  })

  it('can switch price formatting to plain numbers in preview and print', () => {
    openPreviewWithSelection()

    fireEvent.click(screen.getByLabelText('Show price as currency'))

    const preview = screen.getByTestId('barcode-preview-variant-1')
    const print = screen.getByTestId('barcode-print-variant-1')

    expect(within(preview).getByText('60')).not.toBeNull()
    expect(within(print).getByText('60')).not.toBeNull()
    expect(within(preview).queryByText('$60.00')).toBeNull()
    expect(within(print).queryByText('$60.00')).toBeNull()
  })

  it('shows struck-through original price with sale price when salePrice is present', () => {
    mockState.product.entities[0].variants = [buildVariant({ salePrice: 45 })]

    openPreviewWithSelection()

    const preview = screen.getByTestId('barcode-preview-variant-1')
    const print = screen.getByTestId('barcode-print-variant-1')

    const previewOriginal = within(preview).getByText('$60.00')
    const printOriginal = within(print).getByText('$60.00')

    expect(previewOriginal.className).toContain('barcode-price-original')
    expect(printOriginal.className).toContain('barcode-price-original')
    expect(within(preview).getByText('$45.00')).not.toBeNull()
    expect(within(print).getByText('$45.00')).not.toBeNull()
  })

  it('switches between formatted and raw variant names in preview and print', () => {
    openPreviewWithSelection()

    const formattedName = 'MANHA 2PC DRESS / Purple / Yellow'
    const rawName = 'MANHA 2PC DRESS'

    expect(within(screen.getByTestId('barcode-preview-variant-1')).getByText(formattedName)).not.toBeNull()
    expect(within(screen.getByTestId('barcode-print-variant-1')).getByText(formattedName)).not.toBeNull()

    fireEvent.click(screen.getByLabelText('Print variant name with attribute values'))

    expect(within(screen.getByTestId('barcode-preview-variant-1')).getByText(rawName)).not.toBeNull()
    expect(within(screen.getByTestId('barcode-print-variant-1')).getByText(rawName)).not.toBeNull()
    expect(within(screen.getByTestId('barcode-preview-variant-1')).queryByText(formattedName)).toBeNull()
    expect(within(screen.getByTestId('barcode-print-variant-1')).queryByText(formattedName)).toBeNull()
  })

  it('loads persisted print settings from localStorage', () => {
    localStorage.setItem(
      'barcode-print-settings',
      JSON.stringify({
        formatPriceAsCurrency: false,
        useFormattedVariantName: false,
      })
    )

    openPreviewWithSelection()

    const preview = screen.getByTestId('barcode-preview-variant-1')
    const print = screen.getByTestId('barcode-print-variant-1')

    expect(within(preview).getByText('60')).not.toBeNull()
    expect(within(print).getByText('60')).not.toBeNull()
    expect(within(preview).getByText('MANHA 2PC DRESS')).not.toBeNull()
    expect(within(print).getByText('MANHA 2PC DRESS')).not.toBeNull()
    expect(within(preview).queryByText('MANHA 2PC DRESS / Purple / Yellow')).toBeNull()
    expect(within(print).queryByText('MANHA 2PC DRESS / Purple / Yellow')).toBeNull()
  })

  it('hides the barcode value text when the setting is turned off', () => {
    openPreviewWithSelection()

    expect(screen.getAllByText('VALUE:SKU-001').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByLabelText('Show Value'))

    expect(within(screen.getByTestId('barcode-preview-variant-1')).queryByText('VALUE:SKU-001')).toBeNull()
    expect(within(screen.getByTestId('barcode-print-variant-1')).queryByText('VALUE:SKU-001')).toBeNull()
  })
})
