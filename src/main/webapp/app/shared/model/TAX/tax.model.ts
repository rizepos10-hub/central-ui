
export interface ITax {
  id?: string;
  code?: string;
  description?: string | null;
  value?: number;
}

export const defaultValue: Readonly<ITax> = {};
