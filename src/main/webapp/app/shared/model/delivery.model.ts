export interface IDeliveryBooking {
    orderId: string;
    date: string;
}

export const defaultValue: Readonly<IDeliveryBooking> = {
    orderId: '',
    date: '',
};