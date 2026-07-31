import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';

export const formatOrderMethodLabel = (orderMethod?: OrderMethod | string | null) => {
  if (!orderMethod) {
    return '-';
  }

  switch (orderMethod) {
    case OrderMethod.PickUp:
      return 'Pickup';
    case OrderMethod.WalkIn:
      return 'Walk In';
    case OrderMethod.Delivery:
      return 'Delivery';
    case OrderMethod.DineIn:
      return 'Dine In';
    default:
      return String(orderMethod);
  }
};
