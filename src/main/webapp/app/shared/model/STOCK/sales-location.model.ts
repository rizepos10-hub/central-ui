import {IBranch} from "app/shared/model/branch.model";

export interface ISalesLocation {
  id?: string;
  name?: string;
  location?: string;
  branch?: string | IBranch;
}

export const defaultValue: Readonly<ISalesLocation> = {};
