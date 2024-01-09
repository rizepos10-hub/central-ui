import {ITerm} from "app/shared/model/term.model";
import {IAttachment} from "app/shared/model/attachment.model";

export interface ITopping {
  id?: string;
  name?: string | null;
  group?: ITerm;
  image?: IAttachment;
  icon?:IAttachment;
}

export const defaultValue: Readonly<ITopping> = {};
