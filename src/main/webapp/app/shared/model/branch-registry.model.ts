import { IBranch } from "app/shared/model/branch.model";
import { ITill } from "app/shared/model/till.model";
import { ITerminalSettings } from "./terminal-settings";

export interface IBranchRegistry {
  id?: string;
  name?: string;
  code?: string;
  branch?: IBranch;
  openTill?: ITill;
  lastOnline?: Date;
  terminalSettings?: ITerminalSettings;
}

export const defaultValue: Readonly<IBranchRegistry> = {};
