import {ITerm} from "app/shared/model/term.model";

export interface ITopping {
  id?: string;
  name?: string | null;
  group?: ITerm
}

export const defaultValue: Readonly<ITopping> = {};
