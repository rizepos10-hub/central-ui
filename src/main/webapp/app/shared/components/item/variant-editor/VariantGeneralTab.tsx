import React from 'react';
import { Translate, translate } from 'react-jhipster';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface VariantGeneralTabProps {
  name?: string;
  sku?: string;
  description?: string;
  showName?: boolean;
  showSku?: boolean;
  showDescription?: boolean;
  showPrice?: boolean;
  showSalePrice?: boolean;
  price?: number;
  salePrice?: number;
  showFormErrors?: boolean;
  onFieldChange: (field: string, value: any) => void;
  children?: React.ReactNode;
}

export const VariantGeneralTab = ({
  name,
  sku,
  description,
  showName = false,
  showSku = false,
  showDescription = true,
  showPrice = false,
  showSalePrice = false,
  price,
  salePrice,
  showFormErrors = false,
  onFieldChange,
  children,
}: VariantGeneralTabProps) => {
  return (
    <div className="w-full space-y-4 pt-3">
      {(showName || showPrice || showSalePrice) && (
        <div className="grid grid-cols-3 gap-4">
          {showName && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                <Translate contentKey="items.update.name">Name</Translate>
              </Label>
              <Input
                name="variant-name"
                required
                placeholder={translate('items.update.placeholders.variantName')}
                value={name || ''}
                onChange={e => onFieldChange('name', e.target.value)}
                className={`h-8 text-xs ${showFormErrors && !name ? 'border-destructive' : ''}`}
              />
            </div>
          )}

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
                onChange={e => onFieldChange('price', parseFloat(e.target.value) || null)}
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
                onChange={e => onFieldChange('salePrice', parseFloat(e.target.value) || null)}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      )}

      {showSku && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.sku">SKU</Translate>
          </Label>
          <Input
            name="sku"
            placeholder={translate('items.update.placeholders.itemSku')}
            value={sku || ''}
            onChange={e => onFieldChange('sku', e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      )}

      {showDescription && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.description">Description</Translate>
          </Label>
          <Textarea
            name="description"
            placeholder={translate('items.update.description')}
            value={description || ''}
            onChange={e => onFieldChange('description', e.target.value)}
            className="text-xs"
          />
        </div>
      )}

      {children}
    </div>
  );
};

export default VariantGeneralTab;
