import { IBranch } from "app/shared/model/branch.model";
import { PrinterCommandMode, PrinterFont } from "app/shared/model/PRINTER/printer-models";

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
  size?: "mm58" | "mm72" | "mm80";
  ipAddress?: string;
  connectionType?: "NETWORK" | "USB"
  reverse: boolean | null;
  modelId?: string | null;
  font?: PrinterFont | null;
  charsPerLine?: number | null;
  commandMode?: PrinterCommandMode | null;
  kitchenComponents?: KitchenPrintComponent[];
}

export interface KitchenPrintComponent {
  type: 'KITCHEN_VARIABLE' | 'SPACE' | 'HORIZONTAL_LINE';
  printerFont?: PrinterFont;
  font: number;
  fontWidth: number;
  fontSize?: number;
  alignment: 'left' | 'center' | 'right';
  bold: boolean;
  italic?: boolean;
  underline: boolean;
  printInRed: boolean;
  variableType?: string;
  lines?: number;
}

export const defaultValue: Readonly<IPrinter> = {
  connectionType: "NETWORK",
  size: "mm72",
  reverse: false
};
