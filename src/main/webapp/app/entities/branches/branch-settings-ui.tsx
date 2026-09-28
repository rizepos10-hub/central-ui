import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/src/main/webapp/app/lib/utils';

/** Marks a setting whose UI exists but is not stored or used by the POS yet. */
export const SoonBadge = () => (
  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Coming soon</span>
);

export const SettingsCard = ({
  title,
  description,
  soon,
  children,
}: {
  title: string;
  description: string;
  soon?: boolean;
  children?: React.ReactNode;
}) => (
  <section className="ws-card grid gap-4 p-4 md:grid-cols-[240px_1fr]" aria-label={title}>
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-sm font-semibold">{title}</h2>
        {soon && <SoonBadge />}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="grid content-start gap-4">{children}</div>
  </section>
);

export const SettingToggle = ({
  id,
  label,
  description,
  checked,
  onChange,
  soon,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  soon?: boolean;
}) => (
  <div className={cn('flex items-start gap-3', soon && 'opacity-50')} data-soon={soon || undefined}>
    <Checkbox id={id} className="mt-0.5" checked={checked} disabled={soon} onCheckedChange={value => onChange?.(value === true)} />
    <div className="grid gap-0.5">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id} className={cn('text-[13px] font-medium', !soon && 'cursor-pointer')}>
          {label}
        </Label>
        {soon && <SoonBadge />}
      </div>
      {description && <p className="m-0 text-xs text-muted-foreground">{description}</p>}
    </div>
  </div>
);

export const SettingField = ({
  id,
  label,
  description,
  soon,
  children,
}: {
  id?: string;
  label: string;
  description?: string;
  soon?: boolean;
  children: React.ReactNode;
}) => (
  <fieldset disabled={soon} className={cn('m-0 grid min-w-0 gap-1.5 border-0 p-0', soon && 'opacity-50')} data-soon={soon || undefined}>
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      {soon && <SoonBadge />}
    </div>
    {children}
    {description && <p className="m-0 text-xs text-muted-foreground">{description}</p>}
  </fieldset>
);
