import {IBranch} from "app/shared/model/branch.model";

export interface ISalesLocation {
  id?: string;
  name?: string;
  location?: string;
  branch?: IBranch;
  type?: "SALES_LOCATION"
}

export const defaultValue: Readonly<ISalesLocation> = {};
