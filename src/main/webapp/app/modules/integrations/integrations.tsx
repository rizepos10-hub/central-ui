import React from 'react';
import { useNavigate } from 'react-router-dom';

import { PageWrapper } from 'app/shared/layout/page-wrapper';

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  logo: string;
  /** Integrations without a settings page yet are listed as coming soon. */
  settingsPath?: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: 'senitron',
    name: 'Senitron',
    category: 'RFID inventory',
    description: 'Sync item and store data with Senitron RFID inventory tracking.',
    logo: '/content/images/integrations/senitron.svg',
    settingsPath: '/senitron-settings',
  },
  {
    id: 'tookan',
    name: 'Tookan',
    category: 'Delivery dispatch',
    description: 'Book delivery tasks with Tookan and track drivers for delivery orders.',
    logo: '/content/images/integrations/tookan.svg',
    settingsPath: '/tookan-settings',
  },
  {
    id: 'easypost',
    name: 'EasyPost',
    category: 'Shipping',
    description: 'Parcel rates and labels from many carriers for wholesale orders shipped by carrier.',
    logo: '/content/images/integrations/easypost.svg',
    settingsPath: '/logistics/shipping-settings#easypost',
  },
  {
    id: 'clickship',
    name: 'ClickShip',
    category: 'Shipping',
    description: 'Parcel and pallet rates and labels through ClickShip (Freightcom) for wholesale carrier orders.',
    logo: '/content/images/integrations/clickship.svg',
    settingsPath: '/logistics/shipping-settings#clickship',
  },
  {
    id: 'kitchenhub',
    name: 'Kitchen Hub',
    category: 'Delivery marketplaces',
    description: 'Receive delivery marketplace orders in one place through Kitchen Hub.',
    logo: '/content/images/integrations/kitchenhub.svg',
  },
];

const Integrations = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Integrations</h2>
        <p className="text-xs text-muted-foreground">Click a logo to open that integration&apos;s settings.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {INTEGRATIONS.map(integration => (
          <button
            key={integration.id}
            type="button"
            aria-label={`${integration.name} settings`}
            disabled={!integration.settingsPath}
            onClick={() => navigate(integration.settingsPath)}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-sm"
          >
            <div className="flex h-16 items-center justify-center rounded-md bg-muted/40">
              <img src={integration.logo} alt={integration.name} className="h-12 max-w-[180px] object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {integration.name}
                {!integration.settingsPath && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Coming soon</span>
                )}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{integration.category}</div>
              <p className="mt-1 text-xs text-muted-foreground">{integration.description}</p>
            </div>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
};

export default Integrations;
