import React, { useEffect, useState } from "react";
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getBranches, searchEntities as searchBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getMeasures, searchEntities as searchMeasures } from "app/entities/item-measure/item-measure.reducer";
import { getEntities as getTags, searchEntities as searchTags } from "app/entities/tag/tag.reducer";
import { getEntities as getAddonGroups, searchEntities as searchAddonGroups } from "app/entities/addon-groups/addon-groups.reducer";
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { Dropdown } from 'primereact/dropdown';
import { DropDownOptionType, IDropDownMap } from "app/shared/model/filter-dropdown-options.model";
import { InputText } from "primereact/inputtext";
import { IBranch } from "app/shared/model/branch.model";
import { IMeasurementUnit } from "app/shared/model/STOCK/measurement-unit.model";
import { ITag } from "app/shared/model/TAG/tag.model";
import { IAddonGroups } from "app/shared/model/ADDON/addon-groups.model";

type DropDownFilterProps = {
  selectedOption: string;
  handleDropdownChange: (fieldName: string, value: { value: string, matchMode: 'equals' }) => void;
  dropDownOptionType: DropDownOptionType;
  fieldName: string;
  classname?: string;
  style?: Record<string, string>;
  placeholder?: string;
};

const DropDownFilter = ({
  selectedOption,
  handleDropdownChange,
  dropDownOptionType,
  fieldName,
  style,
  classname,
  placeholder = ""
}: DropDownFilterProps) => {
  const dispatch = useAppDispatch();
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
  const measureList: IMeasurementUnit[] = useAppSelector(state => state.itemMeasure.entities);
  const branches: IBranch[] = useAppSelector(state => state.branch.entities);
  const tags: ITag[] = useAppSelector(state => state.tag.entities);
  const addonGroups: IAddonGroups[] = useAppSelector(state => state.addonGroups.entities);
  const [searchTerm, setSearchTerm] = useState("");

  const dropDownMap: IDropDownMap = {
    RETAIL_CATEGORY: {
      options: retailCategories,
      getEntities: getRetailCategories,
      searchEntities: searchRetailCategories,
    },
    RESTAURANT_CATEGORY: {
      options: restaurantCategories,
      getEntities: getRestaurantCategories,
      searchEntities: searchRestaurantCategories,
    },
    BRANCH: {
      options: branches,
      getEntities: getBranches,
      searchEntities: searchBranches,
    },
    MEASURE: {
      options: measureList,
      getEntities: getMeasures,
      searchEntities: searchMeasures
    },
    TAG: {
      options: tags,
      getEntities: getTags,
      searchEntities: searchTags
    },
    ADDON_GROUP: {
      options: addonGroups,
      getEntities: getAddonGroups,
      searchEntities: searchAddonGroups
    }
  };
  useEffect(() => {
    dispatch(
      dropDownMap[dropDownOptionType].getEntities({
        page: 0,
        size: 1000,
        sort: "name,asc"
      })
    );
  }, [dropDownOptionType, dispatch]);

  const filterElement = () => (
    <span className="p-input-icon-right">
      <InputText
        placeholder="Search"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <i className="pi pi-search" />
    </span>
  );

  const sortedOptions = [...dropDownMap[dropDownOptionType].options].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const filteredOptions = searchTerm
    ? sortedOptions.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : sortedOptions;

  return (
    <Dropdown
      options={filteredOptions}
      showFilterClear={true}
      showClear
      filterTemplate={filterElement}
      filter
      style={style}
      placeholder={placeholder}
      className={classname}
      optionLabel="name"
      optionValue="id"
      value={selectedOption}
      onChange={e => {
        handleDropdownChange(fieldName, { value: e.target.value, matchMode: "equals" });
      }}
    />
  );
};

export default DropDownFilter;
