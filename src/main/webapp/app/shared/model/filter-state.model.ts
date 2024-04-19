import { FilterMatchMode } from "primereact/api";

interface Filter {
  value: string;
  matchMode: FilterMatchMode;
}

export interface IFilters {
  [key: string]: Filter;
}

export interface ILazyState {
  first: number;
  rows: number;
  page: number;
  sortField: string | null;
  sortOrder: string | null;
  query: string;
  filters: {
    "categories.id": Filter;
    "attributes": Filter;
    name: Filter;
  };
}

export const initialItemFilterState: ILazyState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    "categories.id": { value: null, matchMode: FilterMatchMode.EQUALS },
    "attributes": { value: null, matchMode: FilterMatchMode.EQUALS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  }
};
