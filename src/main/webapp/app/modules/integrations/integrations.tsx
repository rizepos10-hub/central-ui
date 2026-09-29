import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Boxes,
  Cable,
  ChevronRight,
  Clock3,
  CreditCard,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  logo: string;
  /** Integrations without a settings page yet are listed as coming soon. */
  settingsPath?: string;
};

// Kept as the original list for existing consumers; the hub below includes every active connection.
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

type IntegrationGroup = 'orders' | 'delivery' | 'operations';

type HubIntegration = {
  id: string;
  name: string;
  group: IntegrationGroup;
  groupLabel: string;
  description: string;
  scope: string;
  detail: string;
  setupPath?: string;
  icon: LucideIcon;
  iconStyle: string;
  comingSoon?: boolean;
};

const HUB_INTEGRATIONS: HubIntegration[] = [
  {
    id: 'uber-eats',
    name: 'Uber Eats',
    group: 'orders',
    groupLabel: 'Orders & menus',
    description: 'Receive Uber Eats orders and keep your menu items in sync.',
    scope: 'Business account + branch stores',
    detail: 'Save the developer credentials once, then map each Uber store to its branch and Online Ordering menu.',
    setupPath: '/third-party-integrations',
    icon: ShoppingBag,
    iconStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'tookan',
    name: 'Tookan',
    group: 'delivery',
    groupLabel: 'Delivery',
    description: 'Dispatch deliveries and receive driver status updates.',
    scope: 'Business account + branch controls',
    detail: 'Store API credentials at business level and choose which branches dispatch through Tookan.',
    setupPath: '/tookan-settings',
    icon: Truck,
    iconStyle: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'icabbi',
    name: 'iCabbi',
    group: 'delivery',
    groupLabel: 'Delivery',
    description: 'Connect branch delivery bookings to your iCabbi account.',
    scope: 'Configured separately per branch',
    detail: 'Each branch has its own service and account credentials, endpoint, and driver assignment settings.',
    setupPath: '/icabbi-settings',
    icon: Cable,
    iconStyle: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  {
    id: 'senitron',
    name: 'Senitron',
    group: 'operations',
    groupLabel: 'Inventory & operations',
    description: 'Sync catalog and inventory activity with Senitron RFID.',
    scope: 'Business connection + branch readers',
    detail: 'Set up the service once for the business. Configure each RFID reader on its POS register.',
    setupPath: '/senitron-settings',
    icon: Boxes,
    iconStyle: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'kitchenhub',
    name: 'Kitchen Hub',
    group: 'orders',
    groupLabel: 'Orders & menus',
    description: 'Centralized ordering connection for delivery marketplaces.',
    scope: 'Provider setup is not available yet',
    detail: 'This connection is being prepared and cannot be configured yet.',
    icon: PackageCheck,
    iconStyle: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    comingSoon: true,
  },
];

const FILTERS: { id: 'all' | IntegrationGroup; label: string }[] = [
  { id: 'all', label: 'All integrations' },
  { id: 'orders', label: 'Orders & menus' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'operations', label: 'Inventory & operations' },
];

const RELATED_SETUP = [
  {
    title: 'Payments & gateways',
    description: 'Manage payment methods and business payment configuration.',
    path: '/details',
    icon: CreditCard,
  },
  {
    title: 'POS registers & readers',
    description: 'Set up register hardware and branch-level reader connections.',
    path: '/branch-register',
    icon: Boxes,
  },
];

const Integrations = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [search, setSearch] = useState('');

  const integrations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return HUB_INTEGRATIONS.filter(integration => {
      const matchesGroup = filter === 'all' || integration.group === filter;
      const searchable = `${integration.name} ${integration.groupLabel} ${integration.description} ${integration.scope} ${integration.detail}`.toLowerCase();
      return matchesGroup && (!query || searchable.includes(query));
    });
  }, [filter, search]);

  const readyCount = HUB_INTEGRATIONS.filter(integration => !integration.comingSoon).length;

  return (
    <PageWrapper className="space-y-7 pb-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-lg sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
              <Cable className="h-3.5 w-3.5" />
              Connected services
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Integrations</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Bring orders, delivery, and store operations together. Each connection shows where its credentials and branch setup belong.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
              <div className="text-2xl font-semibold">{readyCount}</div>
              <div className="mt-1 text-xs text-slate-300">Available to configure</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
              <div className="text-2xl font-semibold">{HUB_INTEGRATIONS.filter(integration => integration.comingSoon).length}</div>
              <div className="mt-1 text-xs text-slate-300">Coming soon</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your connections</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a service to view its setup and sync options.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search integrations"
                className="pl-9"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search integrations"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-muted/70 p-1" role="group" aria-label="Filter integrations">
              {FILTERS.map(option => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={filter === option.id ? 'secondary' : 'ghost'}
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id)}
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {integrations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {integrations.map(integration => {
              const Icon = integration.icon;
              return (
                <article key={integration.id} className="group flex min-h-[270px] flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${integration.iconStyle}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${integration.comingSoon ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                      {integration.comingSoon ? <Clock3 className="h-3 w-3" /> : <Cable className="h-3 w-3" />}
                      {integration.comingSoon ? 'Coming soon' : 'Ready to configure'}
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{integration.groupLabel}</div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{integration.name}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{integration.description}</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-muted/60 p-3">
                    <div className="text-xs font-semibold text-foreground">{integration.scope}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{integration.detail}</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    {integration.setupPath ? (
                      <Button type="button" size="sm" onClick={() => integration.setupPath && navigate(integration.setupPath)} className="gap-2">
                        Configure <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" disabled className="gap-2">
                        Not available yet <Clock3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Search className="mx-auto h-6 w-6 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">No integrations found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try another name or category.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-muted/30 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm"><Boxes className="h-4 w-4" /></div>
          <div>
            <h2 className="text-sm font-semibold">Related setup</h2>
            <p className="text-xs text-muted-foreground">Operational settings that work alongside your integrations.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {RELATED_SETUP.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            );
          })}
        </div>
      </section>
    </PageWrapper>
  );
};

export default Integrations;
