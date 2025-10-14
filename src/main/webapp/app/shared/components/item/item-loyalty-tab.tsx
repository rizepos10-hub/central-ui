import {Translate} from "react-jhipster";
import React from "react";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const ItemLoyaltyTab = ({excludedFromLoyaltyPoints, onFieldChange}) => {

  return (
    <div className="my-3">
      <div className="md:w-1/3">
        <div className="flex items-center gap-2 my-3">
          <Checkbox
            checked={excludedFromLoyaltyPoints}
            onCheckedChange={(checked) => onFieldChange('excludedFromLoyaltyPoints', checked)}
          />
          <Label className="text-xs font-semibold cursor-pointer">
            <Translate contentKey="items.update.excludedFromLoyalty">Excluded From Loyalty Points</Translate>
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ItemLoyaltyTab;
