import React, { useEffect, useState } from "react";
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getBranches, searchEntities as searchBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getMeasures, searchEntities as searchMeasures } from "app/entities/item-measure/item-measure.reducer";

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { Dropdown } from 'primereact/dropdown';
import { DropDownOptionType, IDropDownMap } from "app/shared/model/filter-dropdown-options.model";

import _ from "lodash";
import { InputText } from "primereact/inputtext";
import { IBranch } from "app/shared/model/branch.model";
import { IMeasurementUnit } from "app/shared/model/STOCK/measurement-unit.model";

type DropDownFilterProps = {
  selectedOption: string;
  handleDropdownChange: (fieldName: string, value: { value: string, matchMode: 'equals' }) => void;
  dropDownOptionType: DropDownOptionType;
  fieldName: string;
  classname?: string;
  style?: Record<string, string>;
  placeholder?: string;
};

const DropDownFilter = ({ selectedOption, handleDropdownChange, dropDownOptionType, fieldName, style, classname, placeholder = "" }: DropDownFilterProps) => {
  const dispatch = useAppDispatch();
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
  const measureList: IMeasurementUnit[] = useAppSelector(state => state.itemMeasure.entities);
  const branches: IBranch[] = useAppSelector(state => state.branch.entities);
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
    }
  };


  useEffect(() => {
    const actionType = dropDownMap[dropDownOptionType];
    const action = searchTerm ? actionType.searchEntities : actionType.getEntities;

    const searchAction = () => {
      if (searchTerm) {
        dispatch(action({
          query: searchTerm
        }));
      } else {
        dispatch(action({
          page: 0,
          size: 100,
          sort: `name,asc`,
        }));
      }
    };

    const debouncedSearchAction = _.debounce(searchAction, 500);
    debouncedSearchAction();

    return () => {
      debouncedSearchAction.cancel();
    };
  }, [searchTerm, dropDownOptionType]);


  const filterElement = () => {
    return (
      <span className="p-input-icon-right" onBlur={e => setSearchTerm('')}>
        <InputText
          placeholder="Search" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} />
        <i className="pi pi-search" />
      </span>
    )
  }

  return (
    <Dropdown
      options={dropDownMap[dropDownOptionType].options}
      showFilterClear={true}
      showClear
      filterTemplate={filterElement}
      filter
      style={style}
      placeholder={placeholder}
      className={classname}
      optionLabel={'name'}
      optionValue={'id'}
      value={selectedOption}
      onChange={e => {
        handleDropdownChange(fieldName, { value: e.target.value, matchMode: 'equals' });
      }}
    />
  );
};

export default DropDownFilter;
