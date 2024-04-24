import { ITerm } from "app/shared/model/term.model";
import { AxiosResponse } from "axios";
import { AsyncThunk } from "@reduxjs/toolkit";
import { IQueryParams } from "app/shared/reducers/reducer.utils";
import { IBranch } from "app/shared/model/branch.model";
import { IMeasurementUnit } from "app/shared/model/STOCK/measurement-unit.model";

export interface IDropDownMap {
  RETAIL_CATEGORY: DropDownCategory<ITerm>;
  RESTAURANT_CATEGORY: DropDownCategory<ITerm>;
  BRANCH: DropDownCategory<IBranch>;
  MEASURE: DropDownCategory<IMeasurementUnit>
}

interface DropDownCategory<T> {
  options: T[];
  getEntities: AsyncThunk<AxiosResponse<T[]>, IQueryParams, any>;
  searchEntities: any;
}

export type DropDownOptionType =  "RETAIL_CATEGORY" | "RESTAURANT_CATEGORY" | "BRANCH" | "MEASURE";