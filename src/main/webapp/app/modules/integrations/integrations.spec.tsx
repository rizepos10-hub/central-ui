import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Integrations, { INTEGRATIONS } from './integrations';
import { model } from 'app/shared/sidebar/AppMenu';

jest.mock('app/shared/layout/page-wrapper', () => ({
  PageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/integrations']}>
      <Routes>
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/senitron-settings" element={<div>senitron page</div>} />
        <Route path="/tookan-settings" element={<div>tookan page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('Integrations', () => {
  it('lists Senitron, Tookan and Kitchen Hub with their logos', () => {
    renderAt();
    expect(INTEGRATIONS.map(i => i.id)).toEqual(['senitron', 'tookan', 'kitchenhub']);
    expect(screen.getByAltText('Senitron')).toBeTruthy();
    expect(screen.getByAltText('Tookan')).toBeTruthy();
    expect(screen.getByAltText('Kitchen Hub')).toBeTruthy();
  });

  it('opens the settings of the clicked integration', () => {
    renderAt();
    fireEvent.click(screen.getByLabelText('Senitron settings'));
    expect(screen.getByText('senitron page')).toBeTruthy();
  });

  it('opens Tookan settings', () => {
    renderAt();
    fireEvent.click(screen.getByLabelText('Tookan settings'));
    expect(screen.getByText('tookan page')).toBeTruthy();
  });

  it('shows Kitchen Hub as coming soon and not clickable', () => {
    renderAt();
    const card = screen.getByLabelText<HTMLButtonElement>('Kitchen Hub settings');
    expect(card.disabled).toBe(true);
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });

  it('has an Integrations main menu tab and Senitron is no longer under Settings', () => {
    const tab = model.find(m => m.label === 'Integrations');
    expect(tab?.to).toBe('/integrations');
    const settings = model.find(m => m.label === 'Settings');
    expect(settings?.items?.some(i => i.to === '/senitron-settings')).toBe(false);
  });
});
