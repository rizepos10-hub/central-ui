import {IPrintingProfile} from "app/shared/model/PRINTER/printing-profile.model";


export interface IProductionCenter {
  id?: string | null;
  name?: string | null;
  orderMethod?: string | null;
  printingProfiles?: IPrintingProfile[] | null;
  /** Branch-resolved singular profile on POS payloads; not used in company admin UI. */
  printingProfile?: IPrintingProfile | null;
  virtual? : boolean;

}

export const defaultValue: Readonly<IProductionCenter> = {};
