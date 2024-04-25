import React from 'react';
import { Col, Label } from 'reactstrap';
import InputTextFilter from 'app/shared/components/filter/input-text-filter';
import { IFilters, ILazyState } from 'app/shared/model/filter-state.model';
import { Button } from 'primereact/button';
import { FilterMatchMode } from 'primereact/api';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import _ from 'lodash';
import AttributeFilter from 'app/shared/components/filter/attribute-filter';

type SharedFilterProps = {
  handleSearch: (query: IFilters) => void;
  itemType: 'RESTAURANT' | 'RETAIL';
  filters: ILazyState['filters'];
  onFilterValueChange: (field: string, value: { value: string; matchMode: FilterMatchMode }) => void;
  filteredAttributes;
};

const SharedFilter = ({ handleSearch, itemType, filters, onFilterValueChange, filteredAttributes }: SharedFilterProps) => {
  const isRetailITem = itemType === 'RETAIL';
  // const filters: IFilters = query.filters;

  const onInputChange = e => {
    const { name, value } = e.target;
    const modifiedValue = { value, matchMode: FilterMatchMode.CONTAINS };
    onFilterValueChange(name, modifiedValue);
  };

  const handleDropdownChange = (field, value) => {
    onFilterValueChange(field, value);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      handleSearch(filters);
    }
  };

  return (
    <form>
      <div className={'d-flex flex-row flex-wrap gap-4'}>
        <div className={'d-flex flex-column flex-1 gap-3'}>
          <div className={'d-flex flex-column'}>
            <Label className={'font-semibold'}>Name</Label>
            <InputTextFilter onKeyDown={handleKeyDown} value={filters?.name?.value} size={30} field={'name'} onChange={onInputChange} />
          </div>

          <div className={'d-flex flex-column'}>
            <Label className={'font-semibold'}>SKU</Label>
            <InputTextFilter
              onKeyDown={handleKeyDown}
              value={filters?.['variants.sku']?.value}
              size={30}
              field={'variants.sku'}
              onChange={onInputChange}
            />
          </div>
        </div>

        <div className={'d-flex flex-row flex-1 gap-3'}>
          <div className={'d-flex flex-column'}>
            <Label className={'font-semibold'}>Category</Label>
            <DropDownFilter
              style={{ minWidth: '18rem' }}
              placeholder={'Select Category'}
              dropDownOptionType={isRetailITem ? 'RETAIL_CATEGORY' : 'RESTAURANT_CATEGORY'}
              selectedOption={filters?.['categories.id']?.value}
              fieldName={'categories.id'}
              handleDropdownChange={handleDropdownChange}
            />
          </div>
          <div className={'d-flex flex-column'}>
            <Label className={'font-semibold'}>Base Measure</Label>
            <DropDownFilter
              style={{ minWidth: '18rem' }}
              dropDownOptionType={'MEASURE'}
              placeholder={'Select Measure'}
              selectedOption={filters?.['baseMeasure.id']?.value}
              fieldName={'baseMeasure.id'}
              handleDropdownChange={handleDropdownChange}
            />
          </div>
          <div className={'d-flex flex-column flex-1 gap-3'}>
              <AttributeFilter filteredAttributes={filteredAttributes} onFilterValueChange={onFilterValueChange} />
          </div>
        </div>
      </div>
    </form>
  );
};

export default SharedFilter;
