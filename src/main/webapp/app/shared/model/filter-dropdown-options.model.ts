import { ITerm } from "app/shared/model/term.model";
import { AxiosResponse } from "axios";
import { AsyncThunk } from "@reduxjs/toolkit";
import { IQueryParams } from "app/shared/reducers/reducer.utils";

export interface IDropDownMap {
  RETAIL_CATEGORY: DropDownCategory;
  RESTAURANT_CATEGORY: DropDownCategory;
}

interface DropDownCategory {
  options: ITerm[];
  getEntities: AsyncThunk<AxiosResponse<ITerm[], any>, IQueryParams, any>;
  searchEntities: any;
}

export type DropDownOptionType =  "RETAIL_CATEGORY" | "RESTAURANT_CATEGORY";