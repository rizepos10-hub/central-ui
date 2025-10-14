import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Minus, Plus, X } from 'lucide-react';

const ComboItemAddonDropDown = ({ itemAddons = [], variantAddons = [], selectedComboAddons, onAddAddon, onDeleteAddon, onIncrement = null, onDecrement = null }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allAddons = [...itemAddons, ...variantAddons];

  const isAllAddonsSelected = allAddons.every((addon) => selectedComboAddons.some((comboAddon) => comboAddon?.addon?.id === addon?.id));

  return (
    <div>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={allAddons.length < 1 || isAllAddonsSelected}
          >
            Add Addons
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto">
          {allAddons
            .filter((addon) => !selectedComboAddons.some((comboAddon) => comboAddon.addon?.id === addon?.id))
            .map((addon) => (
              <DropdownMenuItem
                key={addon?.id}
                onClick={() => onAddAddon(addon)}
                className="text-xs"
              >
                {addon.name}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="space-y-2 mt-2">
        {selectedComboAddons.map((comboAddon, index) => (
          <div key={comboAddon?.addon?.id} className="flex items-center gap-2">
            <div className="w-32 text-xs">{comboAddon?.addon?.name}:</div>
            <div className="flex gap-1 items-center">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onDecrement(index)}
                disabled={comboAddon?.addon?.amount <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-center">
                {comboAddon?.amount || 0}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onIncrement(index)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDeleteAddon(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComboItemAddonDropDown;
