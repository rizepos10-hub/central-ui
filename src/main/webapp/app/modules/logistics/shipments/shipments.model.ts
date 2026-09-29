import { AUTHORITIES } from 'app/config/constants';

import { WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';

export type ShipmentStage = 'WAITING_FACTORY' | 'READY' | 'SHIPPED' | 'DELIVERED';

export interface IShipmentRow {
  orderId: string;
  sequenceNumber?: number | null;
  customerId?: string | null;
  customerName?: string | null;
  factoryId?: string | null;
  factoryName?: string | null;
  deliveryDate?: string | null;
  factoryOrderId?: string | null;
  factoryOrderStatus?: string | null;
  stage: ShipmentStage;
  carrierId?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  shippedBy?: string | null;
  deliveredAt?: string | null;
  deliveredBy?: string | null;
  total?: number | null;
}

export interface IShipRequest {
  carrierId: string | null;
  trackingNumber: string;
  notes?: string | null;
}

export const SHIPMENT_STAGES: { value: ShipmentStage; label: string; empty: string }[] = [
  { value: 'READY', label: 'Ready to ship', empty: 'Nothing is ready to ship.' },
  { value: 'WAITING_FACTORY', label: 'Waiting for the factory', empty: 'No orders are waiting for the factory.' },
  { value: 'SHIPPED', label: 'Shipped', empty: 'No orders are with a carrier.' },
  { value: 'DELIVERED', label: 'Delivered', empty: 'No delivered orders.' },
];

export const STAGE_LABEL: Record<ShipmentStage, string> = {
  WAITING_FACTORY: 'Waiting for factory',
  READY: 'Ready to ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

export const STAGE_TONE: Record<ShipmentStage, WholesaleStatusTone> = {
  WAITING_FACTORY: 'neutral',
  READY: 'new',
  SHIPPED: 'amendment',
  DELIVERED: 'approved',
};

/** Match the shipment endpoints: factories ship, the sales office confirms delivery. */
export const SHIPPER_ROLES = [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_FACTORY];
export const DELIVERY_ROLES = [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER];

export const isStage = (value: string | null): value is ShipmentStage => SHIPMENT_STAGES.some(s => s.value === value);

export const shipmentErrors = (request: IShipRequest): Partial<Record<'carrierId' | 'trackingNumber', string>> => {
  const errors: Partial<Record<'carrierId' | 'trackingNumber', string>> = {};
  if (!request.carrierId) errors.carrierId = 'Choose the carrier';
  if (!request.trackingNumber.trim()) errors.trackingNumber = 'Enter the tracking number';
  else if (request.trackingNumber.trim().length > 200) errors.trackingNumber = 'Use at most 200 characters';
  return errors;
};
