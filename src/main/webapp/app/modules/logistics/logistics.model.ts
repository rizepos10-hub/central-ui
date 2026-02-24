import { IOrder } from 'app/shared/model/ORDER/order.model';

export enum WholesaleRouteStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WholesaleRouteStopStatus {
  PENDING = 'PENDING',
  VISITED = 'VISITED',
  SKIPPED = 'SKIPPED',
}

export interface IWholesaleRouteStop {
  sequenceNumber?: number;
  orderId?: string;
  order?: IOrder;
  plannedArrivalTime?: string;
  actualArrivalTime?: string | null;
  status?: WholesaleRouteStopStatus | string;
  notes?: string;
}

export interface IWholesaleRoute {
  id?: string;
  name?: string;
  routeDate?: string;
  warehouseBranchId?: string;
  status?: WholesaleRouteStatus;
  salesmanIds?: string[];
  navigationUrl?: string;
  stops?: IWholesaleRouteStop[];
}

export const defaultValue: Readonly<IWholesaleRoute> = {};
