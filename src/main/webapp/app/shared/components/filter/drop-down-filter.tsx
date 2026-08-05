import React, { useEffect, useMemo, useState } from "react";
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getBranches, searchEntities as searchBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getMeasures, searchEntities as searchMeasures } from "app/entities/item-measure/item-measure.reducer";
import { getEntities as getTags, searchEntities as searchTags } from "app/entities/tag/tag.reducer";
import { getEntities as getAddonGroups, searchEntities as searchAddonGroups } from "app/entities/addon-groups/addon-groups.reducer";
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getProfileGroups, searchEntities as searchProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { useAppDispatch } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { DropDownOptionType, IDropDownMap } from "app/shared/model/filter-dropdown-options.model";
import { IBranch } from "app/shared/model/branch.model";
import { IMeasurementUnit } from "app/shared/model/STOCK/measurement-unit.model";
import { ITag } from "app/shared/model/TAG/tag.model";
import { IAddonGroups } from "app/shared/model/ADDON/addon-groups.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import Select from 'app/shared/components/select/select';

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
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const pageSize = 20;

  const dropDownMap: IDropDownMap = {
    RETAIL_CATEGORY: {
      getEntities: getRetailCategories,
      searchEntities: searchRetailCategories,
    },
    RESTAURANT_CATEGORY: {
      getEntities: getRestaurantCategories,
      searchEntities: searchRestaurantCategories,
    },
    BRANCH: {
      getEntities: getBranches,
      searchEntities: searchBranches,
    },
    MEASURE: {
      getEntities: getMeasures,
      searchEntities: searchMeasures
    },
    TAG: {
      getEntities: getTags,
      searchEntities: searchTags
    },
    ADDON_GROUP: {
      getEntities: getAddonGroups,
      searchEntities: searchAddonGroups
    },
    PROFILE_GROUP: {
      getEntities: getProfileGroups,
      searchEntities: searchProfileGroups
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadOptions = async () => {
      try {
        setLoading(true);
        const response = await dispatch(
          dropDownMap[dropDownOptionType].searchEntities({
            query: searchValue,
            page: 0,
            size: pageSize,
            sort: 'name,asc',
          })
        ).unwrap();

        if (ignore) {
          return;
        }

        const nextOptions = (Array.isArray(response.data) ? response.data : [])
          .map(option => ({
            value: (option as any).id || (option as any).addonGroup?.id || '',
            label: (option as any).name || (option as any).addonGroup?.name || '',
          }))
          .filter(option => option.value && option.label);
        const totalCount = Number(response.headers?.['x-total-count']);

        setOptions(nextOptions);
        setPage(0);
        setHasMore(Number.isFinite(totalCount) ? nextOptions.length < totalCount : nextOptions.length === pageSize);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(loadOptions, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, dropDownOptionType, searchValue]);

  const loadMore = async () => {
    if (loading || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setLoading(true);

    try {
      const response = await dispatch(
        dropDownMap[dropDownOptionType].searchEntities({
          query: searchValue,
          page: nextPage,
          size: pageSize,
          sort: 'name,asc',
        })
      ).unwrap();

      const nextOptions = (Array.isArray(response.data) ? response.data : [])
        .map(option => ({
          value: (option as any).id || (option as any).addonGroup?.id || '',
          label: (option as any).name || (option as any).addonGroup?.name || '',
        }))
        .filter(option => option.value && option.label);
      const totalCount = Number(response.headers?.['x-total-count']);

      setOptions(prevOptions => {
        const optionMap = new Map(prevOptions.map(option => [option.value, option]));
        nextOptions.forEach(option => optionMap.set(option.value, option));
        return Array.from(optionMap.values());
      });
      setPage(nextPage);
      setHasMore(Number.isFinite(totalCount) ? options.length + nextOptions.length < totalCount : nextOptions.length === pageSize);
    } finally {
      setLoading(false);
    }
  };

  const selectOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label)),
    [options]
  );

  return (
    <Select
      value={selectOptions.find(opt => opt.value === selectedOption) || null}
      options={selectOptions}
      onInputChange={(inputValue, actionMeta) => {
        if (actionMeta.action === 'input-change') {
          setSearchValue(inputValue);
        }
      }}
      onMenuScrollToBottom={loadMore}
      onChange={(selected) => {
        handleDropdownChange(fieldName, { value: selected?.value || null, matchMode: "equals" });
      }}
      isClearable
      isLoading={loading}
      noOptionsMessage={() => (loading ? 'Loading...' : 'No results found')}
      placeholder={placeholder}
      className={classname}
    />
  );
};

export default DropDownFilter;
