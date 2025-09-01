import axios from 'axios';
import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { serializeAxiosError } from "app/shared/reducers/reducer.utils";

export type FileType = "REGULAR_RESTAURANT" | "ADDON" | "TOPPING" | "RETAIL" | "SUPPLIER" | "ADDON_GROUPS"


type DataImport = {
  loading: boolean;
  importSuccess: boolean;
  errorMessage: string | null;
}

const initialState: DataImport = {
  loading: false,
  importSuccess: false,
  errorMessage: null
};

const apiUrl = '/api/import-data';


// Actions


export const importRetailData = createAsyncThunk('item/retail-data-import', async (formData: { file: File }) => {

  return await axios.post('/api/import-retail-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
  { serializeError: serializeAxiosError }
);

export const importData = createAsyncThunk('item/data-import', async (formData: { file: File; type: FileType }) => {

  return await axios.post('/api/import-restaurant-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
  { serializeError: serializeAxiosError }
);

export const importDataFromOldSystem = createAsyncThunk('item/data-import', async (formData: { file: File }) => {
  return await axios.post('/api/import-json-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
  { serializeError: serializeAxiosError }
);

export const importSupplierData = createAsyncThunk('supplier/data-import', async (formData: { file: File }) => {
  return await axios.post('/api/import-supplier-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
  { serializeError: serializeAxiosError }
);

export const importAddonGroupsData = createAsyncThunk('addon-groups/data-import', async (formData: { file: File }) => {
  return await axios.post('/api/import-addon-groups-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
  { serializeError: serializeAxiosError }
);


// slice

export const DataImportSlice = createSlice({
  name: 'import-data',
  reducers: {},
  initialState,
  extraReducers(builder) {
    builder
      .addMatcher(isPending(importData, importRetailData, importSupplierData, importAddonGroupsData, importDataFromOldSystem), state => {
        state.errorMessage = null;
        state.importSuccess = false;
        state.loading = true;
      })
      .addMatcher(isFulfilled(importData, importRetailData, importSupplierData, importAddonGroupsData, importDataFromOldSystem), state => {
        state.loading = false;
        state.importSuccess = true;
      })
      .addMatcher(isRejected(importData, importRetailData, importSupplierData, importAddonGroupsData, importDataFromOldSystem), (state, action) => {
        state.errorMessage = action.error.message;
        state.loading = false
        state.importSuccess = false
      })

  },
});


// Reducer
export default DataImportSlice.reducer;
