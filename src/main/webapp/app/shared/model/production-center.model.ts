import {IPrintingProfile} from "app/shared/model/printing-profile.model";


export interface IProductionCenter {
  id?: string | null;
  name?: string | null;
  orderMethod?: string | null;
  printingProfile?: IPrintingProfile | null;
  virtual? : boolean;

}

export const defaultValue: Readonly<IProductionCenter> = {};
