export interface IVoidReasons{
  id: string;
  code: string;
  reason: string | null;
}

export const defaultValue: Readonly<IVoidReasons> = {
  id: '',
  code: '',
  reason: null,
};
