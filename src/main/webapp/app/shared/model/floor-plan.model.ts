import { IBranch } from 'app/shared/model/branch.model';

interface ITablePosition {
  x?: number;
  y?: number;
}

interface ITableDetails {
  table?: {
    id?: string;
  };
  numberOfSeats?: number;
  position: ITablePosition;
}

export interface IFloorPlanSection {
  id?: string;
  name?: string;
  backgroundImage?: {
    id?: string;
  };
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
