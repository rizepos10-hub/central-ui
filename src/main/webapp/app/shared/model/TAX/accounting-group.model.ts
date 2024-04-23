export interface IAccountingGroup {
  id: string;
  name: string;
  accountingId: string | null;
  profiles: any[];
}

export const defaultValue: Readonly<IAccountingGroup> = {
  id: null,
  name: '',
  accountingId: '',
  profiles: [],
};
