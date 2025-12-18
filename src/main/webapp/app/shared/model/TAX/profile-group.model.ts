import { ITaxProfile } from "./tax-profile.model";

export interface IProfileGroup {
  id?: string;
  name?: string;
  accountingId?: string | null;
  profiles?: ITaxProfile[];
}

export const defaultValue: Readonly<IProfileGroup> = {
  id: null,
  name: '',
  accountingId: '',
  profiles: [],
};
