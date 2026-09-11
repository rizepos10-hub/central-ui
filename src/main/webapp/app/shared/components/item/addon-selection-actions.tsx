import React from 'react';
import { Button } from '@/components/ui/button';
import { IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';

export const updateAddonGroupAddonSelection = (addonGroup: IAddonGroups, includeAll: boolean): IAddonGroups => ({
  ...addonGroup,
  excluded: includeAll ? [] : [...(addonGroup.addonGroup?.addons ?? [])],
});

type AddonSelectionActionsProps = {
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
};

export const AddonSelectionActions = ({ onSelectAll, onClearAll, disabled = false }: AddonSelectionActionsProps) => (
  <div className="flex flex-wrap gap-2 items-center text-xs font-normal">
    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onSelectAll} disabled={disabled}>
      Select all
    </Button>
    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onClearAll} disabled={disabled}>
      Clear all
    </Button>
  </div>
);
