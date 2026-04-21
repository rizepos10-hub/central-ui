import React from 'react';
import { render, screen } from '@testing-library/react';

import { EodReportLayout } from './eod-report-layout';

const summary = {
  brandingInformation: {
    businessName: 'Maza Foods',
    businessAddress: '123 Main St',
    branchName: 'Main Branch',
  },
  fromDate: '2026-03-01T00:00:00.000Z',
  toDate: '2026-03-31T23:59:59.000Z',
  report: JSON.stringify({
    totalSales: {
      orders: 1,
      subTotal: 10,
      discount: 0,
      appliedCoupon: 0,
      deliveryCharge: 0,
      deliveryTAX: 0,
      refunds: 0,
      netSales: 10,
      totalTAX: 0,
      grossSales: 10,
      walletCredits: 0,
      totalTip: 0,
      taxes: {},
    },
  }),
};

describe('EodReportLayout', () => {
  it('renders the built-in branding header by default', () => {
    render(<EodReportLayout summary={summary} />);

    expect(screen.getByText('Maza Foods')).not.toBeNull();
    expect(screen.getByText('123 Main St')).not.toBeNull();
    expect(screen.getByText('Main Branch')).not.toBeNull();
  });

  it('suppresses the built-in branding header when hideBrandingHeader is true', () => {
    render(<EodReportLayout summary={summary} hideBrandingHeader />);

    expect(screen.queryByText('Maza Foods')).toBeNull();
    expect(screen.queryByText('123 Main St')).toBeNull();
    expect(screen.queryByText('Main Branch')).toBeNull();
  });
});
