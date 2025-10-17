import React, { useEffect } from "react";
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getBranches, searchEntities as searchBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getMeasures, searchEntities as searchMeasures } from "app/entities/item-measure/item-measure.reducer";
import { getEntities as getTags, searchEntities as searchTags } from "app/entities/tag/tag.reducer";
import { getEntities as getAddonGroups, searchEntities as searchAddonGroups } from "app/entities/addon-groups/addon-groups.reducer";
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getProfileGroups, searchEntities as searchProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { DropDownOptionType, IDropDownMap } from "app/shared/model/filter-dropdown-options.model";
import { IBranch } from "app/shared/model/branch.model";
import { IMeasurementUnit } from "app/shared/model/STOCK/measurement-unit.model";
import { ITag } from "app/shared/model/TAG/tag.model";
import { IAddonGroups } from "app/shared/model/ADDON/addon-groups.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import Select from 'react-select';

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
  const profileGroups: IProfileGroup[] = useAppSelector(state => state.profileGroup.entities);

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
    },
    PROFILE_GROUP: {
      options: profileGroups,
      getEntities: getProfileGroups,
      searchEntities: searchProfileGroups
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

  const sortedOptions = [...dropDownMap[dropDownOptionType].options].sort((a, b) =>
    a?.name?.localeCompare(b.name)
  );

  const selectOptions = sortedOptions.map(option => ({
    value: (option as any).id || (option as any).addonGroup?.id,
    label: (option as any).name || (option as any).addonGroup?.name
  }));

  return (
    <Select
      value={selectOptions.find(opt => opt.value === selectedOption) || null}
      options={selectOptions}
      onChange={(selected) => {
        handleDropdownChange(fieldName, { value: selected?.value || null, matchMode: "equals" });
      }}
      isClearable
      placeholder={placeholder}
      className={classname}
      menuPortalTarget={document.body}
      styles={{
        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        menu: (base) => ({ ...base, fontSize: '0.75rem' }),
        option: (base) => ({ ...base, fontSize: '0.75rem' }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
      }}
    />
  );
};

export default DropDownFilter;
