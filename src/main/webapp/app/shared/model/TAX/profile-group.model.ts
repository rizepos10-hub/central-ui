export interface IProfileGroup {
  id: string;
  name: string;
  accountingId: string | null;
  profiles: any[];
}

export const defaultValue: Readonly<IProfileGroup> = {
  id: null,
  name: '',
  accountingId: '',
  profiles: [],
};
