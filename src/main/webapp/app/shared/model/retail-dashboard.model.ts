export interface IRetailDashboard {
    nodes?: IRetailDashboardNode[];
    dateRange?: {
        from: string;
        to: string;
    }
    branch?: string;
}

export interface IRetailDashboardNode {
    x?: number;
    y?: number;
    label?: string;
}

export const defaultValue: Readonly<IRetailDashboard> = {};