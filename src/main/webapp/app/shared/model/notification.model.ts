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
}

export const defaultValue: Readonly<INotification> = {};