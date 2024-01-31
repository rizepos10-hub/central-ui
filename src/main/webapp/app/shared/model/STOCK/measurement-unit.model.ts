export interface IMeasurementUnit {
  id?: string;
  name?: string;
  default?: boolean;
}

export const defaultValue: Readonly<IMeasurementUnit> = {};
