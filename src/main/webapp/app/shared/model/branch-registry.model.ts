import { IBranch } from "app/shared/model/branch.model";

export interface IBranchRegistry {
  id?: string;
  name?: string;
  code?: string;
  branch?: IBranch;
}

export const defaultValue: Readonly<IBranchRegistry> = {};
