import React from 'react';
import { Translate, translate } from 'react-jhipster';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from 'app/shared/components/select/select';
import DiscountDropdown from 'app/shared/components/item/discount-dropdown';
import { IDiscount } from 'app/shared/model/discount.model';
import { IMixAndMatchRule } from 'app/shared/model/mix-and-match-rule.model';
import { IProfileGroup } from 'app/shared/model/TAX/profile-group.model';

interface VariantPricingTabProps {
  price?: number;
  salePrice?: number;
  discounts?: IDiscount[];
  mixAndMatchRule?: IMixAndMatchRule;
  accountingGroups?: IProfileGroup[];
  showPrice?: boolean;
  showSalePrice?: boolean;
  showDiscounts?: boolean;
  showMixAndMatch?: boolean;
  showProfileGroups?: boolean;
  mixAndMatchRuleList?: IMixAndMatchRule[];
  profileGroupsOptions?: IProfileGroup[];
  showFormErrors?: boolean;
  variantIndex?: number;
  onFieldChange: (field: string, value: any) => void;
  onVariantFieldChange?: (variantIndex: number, field: string, value: any) => void;
  children?: React.ReactNode;
}

export const VariantPricingTab = ({
  price,
  salePrice,
  discounts,
  mixAndMatchRule,
  accountingGroups,
  showPrice = false,
  showSalePrice = false,
  showDiscounts = true,
  showMixAndMatch = true,
  showProfileGroups = false,
  mixAndMatchRuleList = [],
  profileGroupsOptions = [],
  showFormErrors = false,
  variantIndex = 0,
  onFieldChange,
  onVariantFieldChange,
  children,
}: VariantPricingTabProps) => {
  const handleVariantChange = (field: string, value: any) => {
    if (onVariantFieldChange) {
      onVariantFieldChange(variantIndex, field, value);
    } else {
      onFieldChange(field, value);
    }
  };

  return (
    <div className="w-full space-y-4 pt-3">
      {(showPrice || showSalePrice) && (
        <div className="grid grid-cols-2 gap-4">
          {showPrice && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                <Translate contentKey="items.update.price">Price</Translate>
              </Label>
              <Input
                type="number"
                name="price"
                required
                min={0}
                step={0.01}
                placeholder={translate('items.update.placeholders.itemPrice')}
                value={price ?? ''}
                onChange={e => handleVariantChange('price', parseFloat(e.target.value) || null)}
                className={`h-8 text-xs ${showFormErrors && (price === null || price === undefined) ? 'border-destructive' : ''}`}
              />
            </div>
          )}
          {showSalePrice && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                <Translate contentKey="items.update.salePrice">Sale Price</Translate>
              </Label>
              <Input
                type="number"
                name="sale-price"
                min={0}
                step={0.01}
                placeholder={translate('items.update.salePrice')}
                value={salePrice ?? ''}
                onChange={e => handleVariantChange('salePrice', parseFloat(e.target.value) || null)}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {showProfileGroups && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              <Translate contentKey="items.update.profileGroups">Profile Group</Translate>
            </Label>
            <Select
              value={accountingGroups || []}
              isClearable
              options={profileGroupsOptions}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
              onChange={profileGroup =>
                handleVariantChange('accountingGroups', profileGroup ? [profileGroup] : [])
              }
            />
          </div>
        )}

        {showDiscounts && (
          <div>
            <DiscountDropdown
              discounts={discounts}
              handleVariantChange={onVariantFieldChange}
              variantIndex={variantIndex}
              handleChange={!onVariantFieldChange ? onFieldChange : undefined}
            />
          </div>
        )}

        {showMixAndMatch && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              <Translate contentKey="items.update.mixAndMatchRule">Mix And Match Rule</Translate>
            </Label>
            <Select
              isClearable
              value={mixAndMatchRule || null}
              options={mixAndMatchRuleList}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
              onChange={rule => handleVariantChange('mixAndMatchRule', rule)}
            />
          </div>
        )}
      </div>

      {children}
    </div>
  );
};

export default VariantPricingTab;
