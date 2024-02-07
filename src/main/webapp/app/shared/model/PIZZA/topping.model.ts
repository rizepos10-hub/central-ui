import {ITerm} from "app/shared/model/term.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IPizzaPricingClass} from "app/shared/model/PIZZA/pizza-pricing-class.model";

export interface ITopping {
  id?: string;
  name?: string | null;
  group?: ITerm;
  image?: IAttachment;
  icon?:IAttachment;
  pricingClass?: IPizzaPricingClass;
}

export const defaultValue: Readonly<ITopping> = {};
