import { Translate } from "react-jhipster";
import Select from "react-select";
import React from "react";
import { IDiscount } from "app/shared/model/discount.model";
import { useAppSelector } from "app/config/store";

type DiscountDropdownProps = {
  discounts: IDiscount[];
  handleChange?: ( fieldName: 'discounts', value: IDiscount[]) => void;
  handleVariantChange?: (variantIndex, fieldName: 'discounts', value: IDiscount[]) => void;
  variantIndex?: number
}

const DiscountDropdown = ({discounts, handleChange, variantIndex, handleVariantChange} :DiscountDropdownProps) => {
  const discountList = useAppSelector(state => state.discount.entities);

  return (
    <div className={'d-flex flex-column gap-2'}>
      <label className={'font-semibold'}>
        <Translate contentKey={'items.update.discounts'}>Discounts</Translate>
      </label>
      <Select
        value={discounts || []}
        options={discountList}
        isClearable
        getOptionLabel={option => (option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`)}
        getOptionValue={option => option.id}
        onChange={selectedDiscounts => {
          variantIndex !== null && variantIndex !== undefined ?
          handleVariantChange(variantIndex, 'discounts', selectedDiscounts ? [selectedDiscounts] as IDiscount[] : [])
          :
          handleChange('discounts', selectedDiscounts ? [selectedDiscounts] as IDiscount[] : []);
        }}
      />
    </div>
  );
}

export default DiscountDropdown