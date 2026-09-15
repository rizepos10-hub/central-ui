import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { PaymentStatus } from '../ENUMS/payment-status.model';
import { DeliverStatus } from '../ENUMS/delivery-status.model';
import { IAddress } from '../address.model';
import { OrderMethod } from '../ENUMS/order-method.model';
import { ServiceChargeKey } from '../service-charge.model';

export interface IOrder extends IOrderAudit {
  id?: string;
  discount?: number | null;
  wholesale?: boolean;
  walkin?: boolean | null;
  status?: OrderStatus | null;
  sequenceNumber?: number | null;
  sourceApp?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
  } | null;
  branchId?: string | null;
  orderSources?: string | null;
  orderMethod?: OrderMethod | null;
  tables?: string | null;
  customer?: ICustomer;
  items?: IOrderedItem[];
  refund?: boolean | null;
  bills?: IBill[];
  scheduledAt?: string | null;
  orderCharges?: IOrderCharge[];
  additionalServiceCharges?: IOrderCharge[];
  deliverTo?: IAddress | null;
  orderDeliveryDetails?: IOrderDeliveryDetails;
  deliveryBookingStatus?: 'PENDING' | 'BOOKED';
  deliveryBookingError?: string | null;
  deliveryBookingLastAttemptAt?: string | null;
  paymentStatus?: PaymentStatus
  processingStatus?: OrderStatus
  deliveryStatus?: DeliverStatus
  orderProcessingStatus?: OrderStatus
  tipAmount?: number | null
  customDiscount?: {
    value?: number | null;
    type?: "PERCENTAGE" | "FLAT";
  },
  total?: number | null,
  totalTaxes?: number | null,
  totalDiscount?: number | null,
  addonsTotal?: number | null,
  itemsTotal?: number | null,
  totalTip?: number | null,
  loyaltyPreview?: ILoyaltyPreview | null,
  tillId?: string | null;
}

export interface IOrderCharge {
  id?: string;
  amount?: number | null;
  chargeType?: ServiceChargeKey;
}

export interface ILoyaltyPreview {
  eligible?: boolean;
  points?: number | null;
  earnableCash?: number | null;
}

export interface IOrderChargesPreviewResponse {
  deliveryCharge?: IOrderCharge | null;
  orderCharges?: IOrderCharge[];
  gratuityOrderCharge?: IOrderCharge | null;
  totalCharges?: number | null;
  loyaltyPreview?: ILoyaltyPreview | null;
}

export interface IPlacePaidOrderRequest {
  order: IOrder;
  bill: {
    payee: string;
    createdBy: string;
    tipAmount: number;
  };
  payment: {
    amount: number;
    tipAmount: number;
    loyaltyPointsToRedeem?: number;
    transactionMethod: string;
  };
}

export interface IOrderDeliveryDetails {
  arriveDate?: string;
  closeDate?: string;
  contactDate?: string;
  createDate?: string;
  date?: string;
  deliveryDetailId?: string;
  deliveryProviderCode?: string;
  driverInformation?: IOrderDeliveryInformation;
  expectedArrivalAt?: string;
  integrationDetails?: IOrderIntegrationDetails;
  pickupDate?: string;
}

export interface IOrderDeliveryInformation {
  driverComment?: string;
  lastName?: string;
  name?: string;
  notes?: string;
  phone?: string;
  photo?: string;
  trackOrderUrl?: string;
  vehicleGroup?: string;
  vehicleType?: string;
}

export interface IOrderIntegrationDetails {
  provider?: 'ICABBI' | 'TOOKAN';
  tripId?: string;
  jobId?: string;
  jobToken?: string;
  pickupDeliveryRelationship?: string;
  pickupHash?: string;
  deliveryHash?: string;
  teamId?: string;
  fleetId?: string;
  tasks?: IOrderIntegrationTask[];
}

export enum OrderIntegrationTaskDeliveryStatus {
  CREATED = 'CREATED',
  ACCEPTED = 'ACCEPTED',
  IN_DELIVERY = 'IN_DELIVERY',
  ARRIVED = 'ARRIVED',
  HANDED = 'HANDED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface IOrderIntegrationTask {
  taskType?: string;
  branchId?: string | null;
  displayText?: string | null;
  displayAddress?: string | null;
  sequence?: number | null;
  statusLabel?: string | null;
  stepState?: string | null;
  jobId?: string;
  jobToken?: string | null;
  jobHash?: string;
  jobStatus?: number | null;
  deliveryStatus?: OrderIntegrationTaskDeliveryStatus | null;
  fleetId?: string;
  fleetName?: string | null;
  fleetPhone?: string | null;
  trackingLink?: string | null;
  jobDescription?: string | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  details?: Record<string, any>;
}

export const defaultValue: Readonly<IOrder> = {
  walkin: false,
  items: [],
  branchId: null,
  customDiscount: {
    value: 0,
    type: "PERCENTAGE"
  }
};
