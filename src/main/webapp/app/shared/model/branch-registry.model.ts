import { IBranch } from "app/shared/model/branch.model";
import { ITill } from "app/shared/model/till.model";

export interface IBranchRegistry {
  id?: string;
  name?: string;
  code?: string;
  branch?: IBranch;
  openTill?: ITill;
  lastOnline?: Date;
}

export const defaultValue: Readonly<IBranchRegistry> = {};
