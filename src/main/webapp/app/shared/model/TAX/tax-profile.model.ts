import { ITax } from "app/shared/model/TAX/tax.model";

export interface ITaxProfile {
  id?: string;
  name?: string;
  description?: string | null;
  value?: number;
  rules?: ITaxRule[];
  taxRate?: ITax
}

export interface ITaxRule {
  max: number | string;
  min: number | string;
  type: "DATES" | "ITEM_UNIT_PRICE"
}

export const defaultValue: Readonly<ITaxProfile> = {};
