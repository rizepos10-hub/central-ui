import { IBranchRegistry } from "app/shared/model/branch-registry.model";

export type TillStatus = "OPENED" | "CLOSE_REQUESTED" | "CLOSED";
export interface ITill {
  id?: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  report?: string;
  openAmount?: number;
  closeAmount?: number;
  status?: TillStatus;
  registry?: IBranchRegistry;
}


export const tillStatuses: ITill['status'][] = ["OPENED", "CLOSE_REQUESTED", "CLOSED"];

export const defaultValue: Readonly<ITill> = {};
