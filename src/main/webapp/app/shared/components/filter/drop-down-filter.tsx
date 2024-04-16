import React, { useEffect, useState } from "react";
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories} from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { Dropdown } from 'primereact/dropdown';
import { DropDownOptionType, IDropDownMap } from "app/shared/model/filter-dropdown-options.model";

import _ from "lodash";
import { InputText } from "primereact/inputtext";

type DropDownFilterProps = {
  selectedOption: ITerm;
  handleDropdownChange: (fieldName: string, value: { value: string, matchMode: 'equals' }) => void;
  dropDownOptionType: DropDownOptionType;
  fieldName: string
};

const DropDownFilter = ({ selectedOption, handleDropdownChange, dropDownOptionType, fieldName }: DropDownFilterProps) => {
  const dispatch = useAppDispatch();
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
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
      searchEntities:  searchRestaurantCategories,
    },
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
          size: 10,
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

  const filterElement = () => (
    <span className="p-input-icon-right">
           <InputText
             placeholder="Search" value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)} />
          <i className="pi pi-search" />
      </span>
  );

  return (
    <Dropdown
      options={dropDownMap[dropDownOptionType].options}
      showFilterClear={true}
      showClear
      filterTemplate={filterElement}
      filter
      optionLabel={'name'}
      optionValue={'id'}
      value={selectedOption}
      onChange={e => handleDropdownChange(fieldName, { value: e.target.value, matchMode: 'equals' })}
    />
  );
};

export default DropDownFilter;
