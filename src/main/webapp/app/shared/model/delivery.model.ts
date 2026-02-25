export interface IDeliveryBooking {
    orderId: string;
    date?: string;
    pickupDate?: string;
    deliveryDate?: string;
    provider?: 'ICABBI' | 'TOOKAN';
    driverId?: string;
    teamId?: string;
}

export const defaultValue: Readonly<IDeliveryBooking> = {
    orderId: '',
};
