export interface IRetailDashboard {
    nodes?: IRetailDashboardNode[];
    dateRange?: {
        from: string;
        to: string;
        dateSlot: IDateSlot
    }
    branch?: string;
}

export interface IDateSlot {
    period: DateSlotPeriod;
    slots?: number;
}

export enum DateSlotPeriod {
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    YEAR = 'YEAR'
}

export interface IRetailDashboardNode {
    x?: number;
    y?: number;
    label?: string;
}

export const defaultValue: Readonly<IRetailDashboard> = {};