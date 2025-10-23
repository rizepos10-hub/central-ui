import { getSortState, Translate } from "react-jhipster";
import Select from 'app/shared/components/select/select';
import React, { useState } from "react";
import { IDiscount } from "app/shared/model/discount.model";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { Label } from '@/components/ui/label';

type DiscountDropdownProps = {
  discounts: IDiscount[];
  handleChange?: (fieldName: 'discounts', value: IDiscount[]) => void;
  handleVariantChange?: (variantIndex, fieldName: 'discounts', value: IDiscount[]) => void;
  variantIndex?: number
}

const DiscountDropdown = ({ discounts, handleChange, variantIndex, handleVariantChange }: DiscountDropdownProps) => {
  const discountList = useAppSelector(state => state.discount.entities);
  const dispatch = useAppDispatch();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">
        <Translate contentKey={'items.update.discounts'}>Discounts</Translate>
      </Label>
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
        onMenuOpen={() => {
          dispatch(
            getDiscounts({
              page: paginationState.activePage - 1,
              size: paginationState.itemsPerPage,
              sort: `${paginationState.sort},${paginationState.order}`,
            })
          );
        }}
      />
    </div>
  );
}

export default DiscountDropdown
