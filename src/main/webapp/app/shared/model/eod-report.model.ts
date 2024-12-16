import { IBranch } from "./branch.model";

export interface IEndOfDayReport {
    id?: string;
    fromDate?: string;
    toDate?: string;
    fromDateString?: string;
    toDateString?: string;
    actionTakenBy?: string;
    createdDate?: string;
    report?: string;
    branch?: IBranch;
}