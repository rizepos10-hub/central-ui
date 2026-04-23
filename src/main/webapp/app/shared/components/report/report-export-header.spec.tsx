import React from 'react';
import { render, screen } from '@testing-library/react';

import ReportExportHeader from './report-export-header';
import { useReportBranding } from './use-report-branding';

jest.mock('./use-report-branding', () => ({
  useReportBranding: jest.fn(),
}));

const mockedUseReportBranding = useReportBranding as jest.MockedFunction<typeof useReportBranding>;

describe('ReportExportHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the business logo, business name, report title, and only non-empty filters', () => {
    mockedUseReportBranding.mockReturnValue({
      businessDetail: null,
      businessName: 'Maza Foods',
      logoUrl: 'https://example.com/logo.png',
    });

    render(
      <ReportExportHeader
        reportTitle="Sales Activity Summary"
        filters={[
          { label: 'Branch', value: 'Main Branch' },
          { label: 'Date Range', value: '2026-03-01 - 2026-03-31' },
          { label: 'Username', value: '' },
          { label: 'Till', value: null },
        ]}
      />
    );

    expect(screen.getByAltText('Business logo')).not.toBeNull();
    expect(screen.getByText('Maza Foods')).not.toBeNull();
    expect(screen.getByText('Sales Activity Summary')).not.toBeNull();
    expect(screen.getByText('Main Branch')).not.toBeNull();
    expect(screen.getByText('2026-03-01 - 2026-03-31')).not.toBeNull();
    expect(screen.queryByText('Username')).toBeNull();
    expect(screen.queryByText('Till')).toBeNull();
  });

  it('omits the image when the business logo is unavailable', () => {
    mockedUseReportBranding.mockReturnValue({
      businessDetail: null,
      businessName: 'Maza Foods',
      logoUrl: '',
    });

    render(<ReportExportHeader reportTitle="Store Credit Report" />);

    expect(screen.queryByAltText('Business logo')).toBeNull();
    expect(screen.getByText('Maza Foods')).not.toBeNull();
    expect(screen.getByText('Store Credit Report')).not.toBeNull();
  });

  it('can stay hidden on screen while remaining available for print and pdf export', () => {
    mockedUseReportBranding.mockReturnValue({
      businessDetail: null,
      businessName: 'Maza Foods',
      logoUrl: '',
    });

    render(<ReportExportHeader reportTitle="Inventory Report" hiddenOnScreen />);

    expect(screen.getByTestId('report-export-header').className).toContain('hidden');
    expect(screen.getByTestId('report-export-header').className).toContain('print:block');
  });
});
