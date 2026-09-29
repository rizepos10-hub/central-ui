import React, { useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { fetchSettings } from '../settings/wholesale-settings.api';
import { IWholesaleCarrier } from '../settings/wholesale-settings.model';
import { ICustomerWholesaleProfile } from './wholesale-customer.model';

const NONE = '__none';

/** Why a customer can't be on a carrier route, matching the server's checks; null when it can. */
export const carrierCustomerProblem = (profile: ICustomerWholesaleProfile): string | null => {
  if (profile.cashOnly) return 'Cash-only customers cannot be on a carrier route.';
  if (profile.defaultPaymentMethod !== 'CREDIT') return 'Carrier customers must pay on account. Set Payment to On account.';
  return null;
};

interface Props {
  profile: ICustomerWholesaleProfile;
  disabled: boolean;
  onChange: (carrierId: string | null) => void;
}

export const CarrierCustomerFields = ({ profile, disabled, onChange }: Props) => {
  const [carriers, setCarriers] = useState<IWholesaleCarrier[]>([]);

  useEffect(() => {
    fetchSettings()
      .then(settings => setCarriers(settings.carriers ?? []))
      .catch(() => setCarriers([]));
  }, []);

  const problem = carrierCustomerProblem(profile);
  const unknown = profile.carrierId && !carriers.some(c => c.id === profile.carrierId);

  return (
    <div className="grid gap-1.5">
      <Label>Carrier</Label>
      <Select value={profile.carrierId ?? NONE} onValueChange={value => onChange(value === NONE ? null : value)} disabled={disabled}>
        <SelectTrigger className="ws-control" aria-label="Carrier">
          <SelectValue />
        </SelectTrigger>
        <WsSelectContent>
          <SelectItem value={NONE}>Choose when shipping</SelectItem>
          {carriers
            .filter(c => c.id && (c.active !== false || c.id === profile.carrierId))
            .map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.active === false ? ' (inactive)' : ''}
              </SelectItem>
            ))}
          {unknown && <SelectItem value={profile.carrierId}>Carrier no longer in the settings</SelectItem>}
        </WsSelectContent>
      </Select>
      {problem ? (
        <span className="text-xs text-destructive">{problem}</span>
      ) : (
        <span className="text-xs text-muted-foreground">
          Shipped by carrier every day. Orders are charged to the customer&apos;s account when delivered.
        </span>
      )}
    </div>
  );
};
