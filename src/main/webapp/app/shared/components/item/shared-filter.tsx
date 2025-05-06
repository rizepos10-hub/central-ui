import React, { useEffect, useState } from 'react';
import { Col, Label } from 'reactstrap';
import InputTextFilter from 'app/shared/components/filter/input-text-filter';
import { IFilters, ILazyState } from 'app/shared/model/filter-state.model';
import { Button } from 'primereact/button';
import { FilterMatchMode } from 'primereact/api';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import _ from 'lodash';
import AttributeFilter from 'app/shared/components/filter/attribute-filter';
import { Checkbox } from 'primereact/checkbox';

type SharedFilterProps = {
  handleSearch: (query: IFilters) => void;
  itemType: 'RESTAURANT' | 'RETAIL';
  filters: ILazyState['filters'];
  onFilterValueChange: (field: string, value: { value: string; matchMode: FilterMatchMode }) => void;
  filteredAttributes;
};

const SharedFilter = ({ handleSearch, itemType, filters, onFilterValueChange, filteredAttributes }: SharedFilterProps) => {
  const [showImagesFilter, setShowImagesFilter] = useState(false);
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

  useEffect(() => {
    if (showImagesFilter) {
      onFilterValueChange('attachments', { value: [] as any, matchMode: FilterMatchMode.NOT_EQUALS });
    } else {
      onFilterValueChange('attachments', { value: null as any, matchMode: FilterMatchMode.CUSTOM });
    }
  }, [showImagesFilter])

  return (
    <form className='w-100 d-flex flex-column gap-3'>
      <div className={'row'}>
        <div className={'col-12 d-flex flex-column gap-1'}>
          <Label className={'font-semibold'}>Name</Label>
          <InputTextFilter onKeyDown={handleKeyDown} value={filters?.name?.value} size={30} field={'name'} onChange={onInputChange} />
        </div>

        <div className={'col-12 d-flex flex-column gap-1'}>
          <Label className={'font-semibold'}>SKU</Label>
          <InputTextFilter
            onKeyDown={handleKeyDown}
            value={filters?.['variants.sku']?.value}
            size={30}
            field={'variants.sku'}
            onChange={onInputChange}
          />
        </div>
        <div className={'col-12 d-flex flex-column gap-1'}>
          <Label className={'font-semibold'}>Category</Label>
          <DropDownFilter
            classname={'w-100'}
            placeholder={'Select Category'}
            dropDownOptionType={isRetailITem ? 'RETAIL_CATEGORY' : 'RESTAURANT_CATEGORY'}
            selectedOption={filters?.['categories.id']?.value}
            fieldName={'categories.id'}
            handleDropdownChange={handleDropdownChange}
          />
        </div>
        <div className={'col-12 d-flex flex-column gap-1'}>
          <Label className={'font-semibold'}>Base Measure</Label>
          <DropDownFilter
            classname={'w-100'}
            dropDownOptionType={'MEASURE'}
            placeholder={'Select Measure'}
            selectedOption={filters?.['baseMeasure.id']?.value}
            fieldName={'baseMeasure.id'}
            handleDropdownChange={handleDropdownChange}
          />
        </div>
        <div className={'col-12 d-flex gap-1'}>
          <div className={'d-flex gap-2'}>
            <Checkbox
              checked={filters?.['attachments']?.matchMode === FilterMatchMode.NOT_EQUALS}
              onChange={(e) => setShowImagesFilter(e.checked)}
            />
          </div>
          <Label className={'font-semibold'}>Show Only Images</Label>
        </div>
      </div>
      <AttributeFilter filteredAttributes={filteredAttributes} onFilterValueChange={onFilterValueChange} />
    </form>
  );
};

export default SharedFilter;
