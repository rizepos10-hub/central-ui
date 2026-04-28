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
  deliverTo?: IAddress | null;
  orderDeliveryDetails?: IOrderDeliveryDetails;
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
  tillId?: string | null;
}

export interface IOrderCharge {
  id?: string;
  amount?: number | null;
  chargeType?: ServiceChargeKey;
}

export interface IOrderChargesPreviewResponse {
  deliveryCharge?: IOrderCharge | null;
  orderCharges?: IOrderCharge[];
  gratuityOrderCharge?: IOrderCharge | null;
  totalCharges?: number | null;
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
