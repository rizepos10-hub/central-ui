import React from 'react';
import { Row, Col } from 'reactstrap';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Translate, translate } from 'react-jhipster';
import VariantBranchPrice from '../variant-branch-price';
import DiscountDropdown from '../discount-dropdown';

export interface PricingSectionProps {
  item: any;
  onFieldChange: (field: string, value: any) => void;
  showFormErrors?: boolean;
  branchList?: any[];
  handleBranchPriceChange?: (variantIndex: number, branchId: any, priceType: string, price: any) => void;
  variantIndex?: number;
  children?: React.ReactNode;
}

const PricingSection: React.FC<PricingSectionProps> = ({
  item,
  onFieldChange,
  showFormErrors,
  branchList,
  handleBranchPriceChange,
  variantIndex = 0,
  children,
}) => (
  <div className="mb-4">
    <h2 className="mb-3 pb-2 border-bottom section-header-orange-brown">
      <Translate contentKey={'items.update.sections.pricing'}>Pricing</Translate>
    </h2>
    <Row className="align-items-center">
      {!item.askForPrice && (
        <Col md="4">
          <div className={'d-flex flex-column gap-2'}>
            <label className={'font-semibold'}>
              {item.itemVariantType === 'RETAIL_VARIABLE' ? 'Default Price' : 'Price'}
            </label>
            <InputNumber
              name="price"
              id="price"
              required={true}
              min={0}
              maxFractionDigits={2}
              inputClassName={'w-1'}
              placeholder={translate('items.update.placeholders.itemPrice')}
              value={item?.variants?.[variantIndex]?.price || null}
              onChange={e => onFieldChange('price', e.value)}
              style={{ borderColor: showFormErrors && !item?.variants?.[variantIndex]?.price ? 'red' : '' }}
            />
          </div>
        </Col>
      )}
      {!item.askForPrice && (
        <Col md="4">
          <div className={'d-flex flex-column gap-2'}>
            <label className={'font-semibold'}>
              <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
            </label>
            <InputNumber
              name="sale-price"
              id="sale-price"
              min={0}
              maxFractionDigits={2}
              placeholder={translate('items.update.placeholders.itemSalePrice')}
              value={item?.variants?.[variantIndex]?.salePrice || null}
              onChange={e => onFieldChange('salePrice', e.value)}
            />
          </div>
        </Col>
      )}
      {branchList && handleBranchPriceChange && (
        <Col md="12" className="mt-3">
          <VariantBranchPrice
            itemVariantType={item.itemType === 'VIRTUAL' ? 'VIRTUAL_GIFTCARD' : item.itemType || 'RETAIL'}
            branchVariantDetails={item?.variants?.[variantIndex]?.branchVariantDetails}
            variantIndex={variantIndex}
            branchList={branchList}
            handleBranchPriceChange={handleBranchPriceChange}
            variant={item?.variants?.[variantIndex]}
            setItem={() => {}}
          />
        </Col>
      )}
      <Col md="3" className="d-flex align-items-center mt-3 mt-md-0">
        <Checkbox
          checked={item?.askForPrice || false}
          onChange={(e) => onFieldChange('askForPrice', e.checked)}
          inputId="askForPrice"
          className="me-2"
        />
        <label htmlFor="askForPrice" className="font-semibold mb-0 ms-1">
          <Translate contentKey={'items.update.askForPrice'}>Ask for Price</Translate>
        </label>
      </Col>
      {children}
    </Row>
  </div>
);

export default PricingSection; 