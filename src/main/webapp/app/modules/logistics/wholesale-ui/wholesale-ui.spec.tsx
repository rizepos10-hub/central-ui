import React from 'react';
import { render, screen } from '@testing-library/react';

import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger } from '@/components/ui/popover';

import { WsDialogContent, WsPopoverContent } from './wholesale-overlays';
import { WholesalePage, WholesaleThemeScope } from './wholesale-page';
import { WholesaleStatusBadge, wholesaleStatusTone } from './wholesale-status-badge';

describe('Wholesale UI', () => {
  it('opens dialogs inside the themed page root', () => {
    render(
      <WholesalePage title="Factory Orders">
        <Dialog open>
          <WsDialogContent>
            <DialogTitle>Send v3</DialogTitle>
          </WsDialogContent>
        </Dialog>
      </WholesalePage>,
    );
    const root = screen.getByTestId('wholesale-page');
    expect(root.classList.contains('theme-wholesale')).toBe(true);
    expect(root.contains(screen.getByRole('dialog'))).toBe(true);
  });

  it('opens popovers inside the themed page root', () => {
    render(
      <WholesalePage>
        <Popover open>
          <PopoverTrigger>Cut-off</PopoverTrigger>
          <WsPopoverContent>7:00 PM</WsPopoverContent>
        </Popover>
      </WholesalePage>,
    );
    expect(screen.getByTestId('wholesale-page').contains(screen.getByText('7:00 PM'))).toBe(true);
  });

  it('themes existing pages and keeps their dialogs inside the theme scope', () => {
    render(
      <WholesaleThemeScope>
        <h1>Customers</h1>
        <Dialog open>
          <WsDialogContent>
            <DialogTitle>Delivery address</DialogTitle>
          </WsDialogContent>
        </Dialog>
      </WholesaleThemeScope>,
    );
    const root = screen.getByTestId('wholesale-theme-scope');
    expect(root.classList.contains('theme-wholesale')).toBe(true);
    expect(root.contains(screen.getByText('Customers'))).toBe(true);
    expect(root.contains(screen.getByRole('dialog'))).toBe(true);
  });

  it('falls back to the document body outside a Wholesale page', () => {
    const { container } = render(
      <Dialog open>
        <WsDialogContent>
          <DialogTitle>Outside</DialogTitle>
        </WsDialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('maps backend statuses to tones', () => {
    expect(wholesaleStatusTone('SENT')).toBe('new');
    expect(wholesaleStatusTone('approved')).toBe('approved');
    expect(wholesaleStatusTone('Returned')).toBe('returned');
    expect(wholesaleStatusTone('CANCELLED')).toBe('cancelled');
    expect(wholesaleStatusTone('AMENDMENT')).toBe('amendment');
    expect(wholesaleStatusTone('SOMETHING_NEW')).toBe('neutral');
    expect(wholesaleStatusTone(null)).toBe('neutral');
  });

  it('labels the badge from the status unless children are given', () => {
    render(
      <>
        <WholesaleStatusBadge status="PARTIALLY_DELIVERED" />
        <WholesaleStatusBadge status="RETURNED">Kaiser roll -100</WholesaleStatusBadge>
      </>,
    );
    expect(screen.getByText('Partially delivered').getAttribute('data-tone')).toBe('neutral');
    expect(screen.getByText('Kaiser roll -100').getAttribute('data-tone')).toBe('returned');
  });
});
