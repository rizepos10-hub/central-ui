import {IBranch} from "app/shared/model/branch.model";

export interface IPrinter {
  id?: string;
  name?: string;
  brand?: string;
  model?: string;
  printSpeed?: number;
  branch?: IBranch;
  colorPrinter?: boolean;
  port?: number;
  serviceName?: string;
  size?:  "mm58" | "mm72" | "mm80";
  ipAddress?: string;
  connectionType?: "NETWORK" | "USB"
}

export const defaultValue: Readonly<IPrinter> = {
  connectionType: "NETWORK",
  size: "mm72"
};
