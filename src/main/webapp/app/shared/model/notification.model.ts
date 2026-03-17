export interface INotification {
    id?: string;
    title?: string;
    message?: string;
    url?: string;
    status?: string;
    type?: string;
    userId?: string;
    sentAt?: string;
    readAt?: string;
    createdAt?: string;
    category?: NotificationCategoryEnum | null
}

export enum NotificationCategoryEnum {
    ORDER = "ORDER",
    DOWNLOAD_FILE = "DOWNLOAD_FILE",
    ON_ACCOUNT_DEBIT = "ON_ACCOUNT_DEBIT"
} 

export const defaultValue: Readonly<INotification> = {};