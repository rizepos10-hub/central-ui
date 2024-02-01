import { IBranch } from 'app/shared/model/branch.model';
import {IAttachment} from "app/shared/model/attachment.model";
import {IFloorPlanTable} from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";

interface ITablePosition {
  x?: number;
  y?: number;
}

interface ITableDetails {
  table?: IFloorPlanTable;
  numberOfSeats?: number;
  position: ITablePosition;
}

export interface IFloorPlanSection {
  id?: string;
  name?: string;
  backgroundImage?: IAttachment;
  tableDetails?: ITableDetails[];
  order?: number;
  dimensions?: {
    width?: number;
    height?: number;
  };
  visible?: boolean;
}

export interface IFloorPlan {
  id?: string;
  name?: string;
  branch?: IBranch;
  sections?: IFloorPlanSection[];
  active?: boolean;
}

export const defaultValue: Readonly<IFloorPlan> = {};
