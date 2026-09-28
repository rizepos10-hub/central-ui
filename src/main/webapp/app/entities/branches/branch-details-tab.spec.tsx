import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IBranchDetails } from 'app/shared/model/business-detail.model';

import { BranchDetailsTab } from './branch-details-tab';

jest.mock('app/shared/components/media-library/media-library', () => () => <div>media library</div>);

const branch = { branchId: 'b1', name: 'Main', wholesale: false, cashbackEnabled: undefined } as unknown as IBranchDetails;

const renderTab = (overrides: Partial<IBranchDetails> = {}) => {
  const set = jest.fn();
  render(
    <BranchDetailsTab
      branch={{ ...branch, ...overrides }}
      branchIndex={0}
      maxIdleTimeoutSeconds={7200}
      set={set}
      onImageChange={jest.fn()}
      onReceiptTextChange={jest.fn()}
      onTimeZoneChange={jest.fn()}
      onEndOfDayReportSectionChange={jest.fn()}
      onIdleTimeoutSecondsChange={jest.fn()}
      onPrepTimeMinutesChange={jest.fn()}
    />,
  );
  return set;
};

const checkbox = (label: string) => screen.getByRole('checkbox', { name: label });

describe('Branch details tab', () => {
  it('groups the settings into cards in the agreed order', () => {
    renderTab();
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual([
      'General Options',
      'End of Day',
      'End of Shift',
      'Online Ordering',
      'Delivery',
      'Pick-up',
      'Table Service',
      'Pizza Settings',
      'Customer Receipt',
      'Kitchen Tickets',
      'KDS Settings',
      'Payments',
    ]);
  });

  it('shows the kitchen output once and uses the new labels', () => {
    renderTab();
    expect(screen.getAllByText('Kitchen output').length).toBe(1);
    expect(checkbox('Enable Wholesale')).toBeTruthy();
    expect(checkbox('Print End of Shift Sales on Clocking out')).toBeTruthy();
    expect(checkbox('Print Items Consolidation')).toBeTruthy();
    expect(screen.getByText('Group Items by:')).toBeTruthy();
  });

  it('saves existing settings to their fields', () => {
    const set = renderTab();
    fireEvent.click(checkbox('Enable Wholesale'));
    expect(set).toHaveBeenCalledWith('wholesale', true);
    fireEvent.click(checkbox('Enable Cash-Back'));
    expect(set).toHaveBeenCalledWith('cashbackEnabled', false);
    fireEvent.click(checkbox('Cash on delivery (COD)'));
    expect(set).toHaveBeenCalledWith('activeCOD', true);
  });

  it('dims and disables settings that are not stored yet, at their default values', () => {
    const set = renderTab();
    const eod = checkbox('Prevent EOD on Untagged Deliveries');
    expect(eod.hasAttribute('disabled')).toBe(true);
    expect(eod.getAttribute('data-state')).toBe('unchecked');
    expect(checkbox('Keep Deliveries as unpaid').getAttribute('data-state')).toBe('checked');
    expect(checkbox('Exit Table Automatically after Print All bills').getAttribute('data-state')).toBe('checked');
    expect(screen.getByLabelText('Minimum amount to Accept Deliveries').matches(':disabled')).toBe(true);
    expect(screen.getByLabelText('Branch Name').matches(':disabled')).toBe(false);
    fireEvent.click(eod);
    expect(set).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[data-soon]').length).toBeGreaterThan(15);
  });
});
