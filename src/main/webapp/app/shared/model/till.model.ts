import { IBranchRegistry } from "app/shared/model/branch-registry.model";

export interface ITill {
  id?: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  report?: string;
  status?: "OPENED" | "CLOSE_REQUESTED"| "CLOSED";
  registry?: IBranchRegistry;
}

export const tillStatuses: ITill['status'][] = ["OPENED", "CLOSE_REQUESTED", "CLOSED"];

export const defaultValue: Readonly<ITill> = {};
