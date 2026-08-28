import React, { useMemo } from 'react';
import { Translate } from 'react-jhipster';
import { GripVertical, Trash2 } from 'lucide-react';
import Select from 'app/shared/components/select/select';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatNumber } from 'app/shared/util/price-utils';

interface AddonGroupAddonsListProps {
  addons: IAddon[];
  availableAddons: IAddon[];
  isLoadingAddons?: boolean;
  disabled?: boolean;
  onAddonsChange: (addons: IAddon[]) => void;
  onSearchAddons: (term: string) => void;
}

export const AddonGroupAddonsList = ({
  addons,
  availableAddons,
  isLoadingAddons = false,
  disabled = false,
  onAddonsChange,
  onSearchAddons,
}: AddonGroupAddonsListProps) => {
  const selectedIds = useMemo(() => new Set((addons || []).map(a => a.id).filter(Boolean)), [addons]);

  const addableOptions = useMemo(
    () => availableAddons.filter(addon => addon.id && !selectedIds.has(addon.id)),
    [availableAddons, selectedIds]
  );

  const handleAddAddons = (selected: IAddon | IAddon[] | null) => {
    if (!selected) {
      return;
    }
    const toAdd = (Array.isArray(selected) ? selected : [selected]).filter(
      addon => addon?.id && !selectedIds.has(addon.id)
    );
    if (toAdd.length === 0) {
      return;
    }
    onAddonsChange([...(addons || []), ...toAdd]);
  };

  const handleRemoveAddon = (addonId?: string) => {
    if (!addonId) {
      return;
    }
    onAddonsChange((addons || []).filter(addon => addon.id !== addonId));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label className="text-xs">
          <Translate contentKey="common.addons">Addons</Translate>
        </Label>
        <Select
          isMulti
          value={[]}
          onChange={selected => handleAddAddons(selected as IAddon[] | null)}
          onInputChange={inputValue => onSearchAddons(inputValue || '')}
          options={addableOptions}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.id}
          placeholder="Search and add addons to this group..."
          isLoading={isLoadingAddons}
          isDisabled={disabled}
          closeMenuOnSelect={false}
          blurInputOnSelect={false}
        />
        <p className="text-[11px] text-muted-foreground">
          Add addons above, then drag the handle or use arrows to set display order on POS and item screens.
        </p>
      </div>

      {(addons || []).length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-8 text-center">
          <p className="text-xs font-medium text-muted-foreground">No addons in this group yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Search above or use Create And Add Addon</p>
        </div>
      ) : (
        <DraggableList
          value={addons}
          onChange={event => onAddonsChange(event.value)}
          dataKey="id"
          dragdrop
          showArrows
          disabled={disabled}
          header={
            <div className="grid grid-cols-[28px_minmax(0,1fr)_88px_36px] items-center gap-3 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>#</span>
              <span>Name</span>
              <span className="text-right">Price</span>
              <span className="sr-only">Actions</span>
            </div>
          }
          itemTemplate={(addon: IAddon, index) => (
            <div
              className="grid grid-cols-[28px_minmax(0,1fr)_88px_36px] items-center gap-3 pr-1"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{addon.name}</p>
                {addon.desc ? <p className="truncate text-[11px] text-muted-foreground">{addon.desc}</p> : null}
              </div>
              <span className="text-right text-xs tabular-nums text-muted-foreground">
                {formatNumber(addon.price ?? 0)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={e => {
                  e.stopPropagation();
                  handleRemoveAddon(addon.id);
                }}
                disabled={disabled}
                aria-label={`Remove ${addon.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      )}

      {(addons || []).length > 0 ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{addons.length} addon{addons.length === 1 ? '' : 's'} · drag to reorder</span>
        </div>
      ) : null}
    </div>
  );
};

export default AddonGroupAddonsList;
