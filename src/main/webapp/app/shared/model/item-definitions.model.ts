
export interface IItemDefinition {
  id?: string;
  name?: string;
  desc?: string | null;
  order?: number | null;
  requiredOptions?: [] | null;
  optionalOptions?: [] | null
}

export const defaultValue: Readonly<IItemDefinition> = {};
