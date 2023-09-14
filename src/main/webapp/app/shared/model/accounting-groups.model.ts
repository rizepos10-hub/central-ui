export interface IAccountingGroups {
  id: string;
  name: string;
  accountingId: string | null;
  profiles: any[];
}

export const defaultValue: Readonly<IAccountingGroups> = {
  id: '',
  name: '',
  accountingId: null,
  profiles: [],
};
