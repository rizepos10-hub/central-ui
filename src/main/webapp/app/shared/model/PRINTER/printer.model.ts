import {IBranch} from "app/shared/model/branch.model";

export interface IPrinter {
  id?: string;
  name?: string;
  brand?: string | null;
  model?: string | null;
  printSpeed?: number | null;
  branch?: IBranch[] | null;
  colorPrinter?: boolean | null
}

export const defaultValue: Readonly<IPrinter> = {};
