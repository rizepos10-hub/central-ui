import {ICurrency} from "app/shared/model/currency.model";
import {IBranch} from "app/shared/model/branch.model";

interface exchangeRate {
  currency?: ICurrency;
  rate?: number;
}

interface branchDisplayCurrency {
  branch: IBranch;
  currency: string;
}

export interface ICurrencySettings {
  defaultCurrency?: ICurrency;
  displayCurrency?: ICurrency;
  exchangeRates?: exchangeRate[];
  branchDisplayCurrencies?: branchDisplayCurrency[];
}

export const defaultValue: Readonly<ICurrencySettings> = {};
