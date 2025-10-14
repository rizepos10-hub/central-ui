import React, { useEffect, useState } from 'react';
import InputTextFilter from 'app/shared/components/filter/input-text-filter';
import { IFilters, ILazyState } from 'app/shared/model/filter-state.model';
import { FilterMatchMode } from 'primereact/api';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import AttributeFilter from 'app/shared/components/filter/attribute-filter';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
    <form className='w-full flex flex-col gap-3'>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Name</Label>
          <InputTextFilter onKeyDown={handleKeyDown} value={filters?.name?.value} size={30} field={'name'} onChange={onInputChange} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">SKU</Label>
          <InputTextFilter
            onKeyDown={handleKeyDown}
            value={filters?.['variants.sku']?.value}
            size={30}
            field={'variants.sku'}
            onChange={onInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Tax</Label>
          <DropDownFilter
            classname={'w-full'}
            placeholder={'Select Tax'}
            dropDownOptionType={'PROFILE_GROUP'}
            selectedOption={filters?.['accountingGroups.id']?.value}
            fieldName={'accountingGroups.id'}
            handleDropdownChange={handleDropdownChange}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Category</Label>
          <DropDownFilter
            classname={'w-full'}
            placeholder={'Select Category'}
            dropDownOptionType={isRetailITem ? 'RETAIL_CATEGORY' : 'RESTAURANT_CATEGORY'}
            selectedOption={filters?.['categories.id']?.value}
            fieldName={'categories.id'}
            handleDropdownChange={handleDropdownChange}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Base Measure</Label>
          <DropDownFilter
            classname={'w-full'}
            dropDownOptionType={'MEASURE'}
            placeholder={'Select Measure'}
            selectedOption={filters?.['baseMeasure.id']?.value}
            fieldName={'baseMeasure.id'}
            handleDropdownChange={handleDropdownChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={filters?.['attachments']?.matchMode === FilterMatchMode.NOT_EQUALS}
            onCheckedChange={(checked) => setShowImagesFilter(checked === true)}
            id="show-images"
            className="h-4 w-4"
          />
          <Label htmlFor="show-images" className="text-xs font-semibold cursor-pointer">
            Show Only Images
          </Label>
        </div>
      </div>

      <AttributeFilter filteredAttributes={filteredAttributes} onFilterValueChange={onFilterValueChange} />
    </form>
  );
};

export default SharedFilter;
