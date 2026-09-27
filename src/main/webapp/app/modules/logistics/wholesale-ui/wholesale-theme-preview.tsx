import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/src/main/webapp/app/lib/utils';

import {
  WsDialogContent,
  WsDropdownMenuContent,
  WsPopoverContent,
  WsSelectContent,
  WsSheetContent,
  WsTooltipContent,
} from './wholesale-overlays';
import { WholesalePage } from './wholesale-page';
import { WholesaleStatusBadge } from './wholesale-status-badge';

const orders = [
  { id: 'FO-0928-W', factory: 'Windsor', version: 2, lines: 6, requested: 3740, approved: 3600, status: 'RETURNED', updated: '7:12 PM' },
  { id: 'FO-0928-T', factory: 'Toronto', version: 1, lines: 8, requested: 5210, approved: 5210, status: 'APPROVED', updated: '6:58 PM' },
  { id: 'FO-0929-W', factory: 'Windsor', version: 1, lines: 4, requested: 2330, approved: null, status: 'SENT', updated: '7:05 PM' },
  { id: 'FO-0929-T', factory: 'Toronto', version: 1, lines: 7, requested: 4880, approved: null, status: 'SENT', updated: '7:06 PM' },
  { id: 'FO-0927-W', factory: 'Windsor', version: 3, lines: 6, requested: 3520, approved: 3540, status: 'AMENDMENT', updated: '5:58 PM' },
  { id: 'FO-0927-T', factory: 'Toronto', version: 2, lines: 8, requested: 5050, approved: 5050, status: 'APPROVED', updated: '5:41 PM' },
];

const allocation = [
  { customer: 'Maple Deli (1)', ordered: 300, gets: 300 },
  { customer: 'Riverside Cafe (2)', ordered: 250, gets: 250 },
  { customer: 'Lakeshore Market (3)', ordered: 400, gets: 340 },
  { customer: 'Oak St. Grocers (4)', ordered: 250, gets: 210 },
];

const kpis: { label: string; value: string; fill: number; color: string; valueColor?: string }[] = [
  { label: 'Sent, waiting for factory', value: '2', fill: 40, color: 'hsl(var(--primary))' },
  { label: 'Returned with shortages', value: '1', fill: 20, color: 'hsl(var(--ws-returned))', valueColor: 'hsl(var(--ws-returned))' },
  { label: 'Approved', value: '3', fill: 60, color: 'hsl(var(--ws-approved))', valueColor: 'hsl(var(--ws-approved))' },
  { label: 'Units short (to re-allocate)', value: '-140', fill: 12, color: 'hsl(var(--ws-returned))' },
];

const number = (value: number | null) => (value == null ? '-' : value.toLocaleString());

/** Test page for the Wholesale theme: the approved preview layout plus every themed overlay. */
const WholesaleThemePreview = () => {
  const [factory, setFactory] = useState('All');
  return (
    <TooltipProvider>
      <WholesalePage
        title="Factory Orders"
        context="Delivery Mon, Sep 28 / Windsor and Toronto / cut-off 7:00 PM"
        actions={
          <>
            <Button variant="outline" className="ws-control">
              Issue invoices
            </Button>
            <Button className="ws-control">Build from order sheets</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(k => (
            <div key={k.label} className="ws-card px-3.5 py-3">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-0.5 text-2xl font-semibold tabular-nums" style={{ color: k.valueColor }}>
                {k.value}
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-sm bg-muted">
                <i className="block h-full" style={{ width: `${k.fill}%`, background: k.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border bg-card">
            {['All', 'Windsor', 'Toronto'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFactory(f)}
                className={cn('px-3 text-[13px]', 'h-[calc(var(--ws-control-h)-2px)]', factory === f && 'bg-accent font-semibold text-accent-foreground')}
              >
                {f}
              </button>
            ))}
          </div>
          <Select defaultValue="2026-09-28">
            <SelectTrigger className="ws-control w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <WsSelectContent>
              <SelectItem value="2026-09-27">Sun, Sep 27</SelectItem>
              <SelectItem value="2026-09-28">Mon, Sep 28</SelectItem>
              <SelectItem value="2026-09-29">Tue, Sep 29</SelectItem>
            </WsSelectContent>
          </Select>
          <Input className="ws-control w-[240px]" placeholder="Search order or product" />
          <div className="flex-1" />
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">Auto-refresh on</span>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="ws-card overflow-hidden">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Factory</th>
                  <th>Ver</th>
                  <th className="ws-num">Lines</th>
                  <th className="ws-num">Requested</th>
                  <th className="ws-num">Approved</th>
                  <th className="ws-num">Diff</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(o => factory === 'All' || o.factory === factory)
                  .map(o => {
                    const diff = o.approved == null ? null : o.approved - o.requested;
                    return (
                      <tr key={o.id}>
                        <td className="ws-mono">{o.id}</td>
                        <td>{o.factory}</td>
                        <td className="ws-mono">v{o.version}</td>
                        <td className="ws-num">{o.lines}</td>
                        <td className="ws-num">{number(o.requested)}</td>
                        <td className={cn('ws-num', o.approved == null && 'text-muted-foreground')}>{number(o.approved)}</td>
                        <td
                          className={cn(
                            'ws-num',
                            diff == null || diff === 0 ? 'text-muted-foreground' : diff < 0 && 'font-semibold text-[hsl(var(--ws-returned))]',
                          )}
                        >
                          {diff == null ? '-' : diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td>
                          <WholesaleStatusBadge status={o.status} />
                        </td>
                        <td className="text-muted-foreground">{o.updated}</td>
                        <td className="w-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${o.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <WsDropdownMenuContent align="end">
                              <DropdownMenuItem>Open</DropdownMenuItem>
                              <DropdownMenuItem>Resend</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                            </WsDropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ws-card">
            <div className="flex items-center gap-2 border-b px-3.5 py-3 text-sm font-semibold">
              Shortage allocation
              <div className="flex-1" />
              <WholesaleStatusBadge tone="returned">Kaiser roll -100</WholesaleStatusBadge>
            </div>
            <div className="grid grid-cols-[1fr_64px_64px] items-center gap-y-2 px-3.5 py-2.5 text-[13px]">
              <span className="text-[11px] font-semibold text-muted-foreground">CUSTOMER (PRIORITY)</span>
              <span className="ws-num text-[11px] text-muted-foreground">ORDERED</span>
              <span className="ws-num text-[11px] text-muted-foreground">GETS</span>
              {allocation.map(a => (
                <React.Fragment key={a.customer}>
                  <span>{a.customer}</span>
                  <span className="ws-num">{a.ordered}</span>
                  <span className={cn('ws-num', a.gets < a.ordered && 'font-semibold text-[hsl(var(--ws-returned))]')}>{a.gets}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="flex gap-2 border-t px-3.5 py-2.5">
              <Button variant="outline" className="ws-control">
                Pro rata
              </Button>
              <div className="flex-1" />
              <Button className="ws-control">Send v3 to Windsor</Button>
            </div>
          </div>
        </div>

        <div className="ws-card flex flex-wrap items-center gap-2 px-3.5 py-3">
          <span className="mr-2 text-sm font-semibold">Overlays</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="ws-control">
                Dialog
              </Button>
            </DialogTrigger>
            <WsDialogContent>
              <DialogHeader>
                <DialogTitle>Send v3 to Windsor?</DialogTitle>
                <DialogDescription>The factory sees the new quantities right away.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button className="ws-control">Send</Button>
              </DialogFooter>
            </WsDialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="ws-control">
                Sheet
              </Button>
            </SheetTrigger>
            <WsSheetContent>
              <SheetHeader>
                <SheetTitle>FO-0928-W</SheetTitle>
                <SheetDescription>Windsor, version 2, returned with shortages.</SheetDescription>
              </SheetHeader>
            </WsSheetContent>
          </Sheet>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ws-control">
                Popover
              </Button>
            </PopoverTrigger>
            <WsPopoverContent className="text-sm">Cut-off for Mon, Sep 28 is 7:00 PM.</WsPopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="ws-control">
                Tooltip
              </Button>
            </TooltipTrigger>
            <WsTooltipContent>Quantities in units</WsTooltipContent>
          </Tooltip>
          <div className="flex-1" />
          {(['new', 'approved', 'returned', 'cancelled', 'amendment', 'neutral'] as const).map(tone => (
            <WholesaleStatusBadge key={tone} tone={tone}>
              {tone.charAt(0).toUpperCase() + tone.slice(1)}
            </WholesaleStatusBadge>
          ))}
        </div>
      </WholesalePage>
    </TooltipProvider>
  );
};

export default WholesaleThemePreview;
