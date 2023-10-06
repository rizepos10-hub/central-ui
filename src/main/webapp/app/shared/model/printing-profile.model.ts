import {IBranch} from "app/shared/model/branch.model";
import {IPrinter} from "app/shared/model/printer.model";



export interface IPrintingProfile {
  id?: string | null;
  name?: string | null;
  branch?: IBranch | {id: string | null} | null;
  printers?: IPrinter[] | [];

}

export const defaultValue: Readonly<IPrintingProfile> = {};
