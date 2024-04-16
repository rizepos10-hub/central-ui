import { FilterMatchMode } from "primereact/api";

export const initialItemFilterState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    "categories.id": {value: null, matchMode: FilterMatchMode.EQUALS},
    name: { value: null, matchMode:  FilterMatchMode.CONTAINS },
  }
};