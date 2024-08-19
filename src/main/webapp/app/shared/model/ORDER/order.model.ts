import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { PaymentStatus } from '../ENUMS/payment-status.model';

export interface IOrder extends IOrderAudit {
  id?: string;
  discount?: number | null;
  walkin?: boolean | null;
  status?: OrderStatus | null;
  branchId?: string | null;
  orderSources?: string | null;
  tables?: string | null;
  customer?: ICustomer;
  items?: IOrderedItem[];
  bills?: IBill[];
  scheduledAt?: string | null;
  orderCharges?: any[];
  paymentStatus?: PaymentStatus
  processingStatus?: OrderStatus
  orderProcessingStatus?: OrderStatus
  tipAmount?: number | null
  customDiscount?: {
    value?: number | null;
    type?: "PERCENTAGE" | "FLAT";
  },
  total?: number | null,
  totalTaxes?: number | null,
  totalDiscount?: number | null,
}

export interface IOrderCharge {
  id?: string;
  amount?: number | null;
  chargeType?: ServiceChargeKey;
}

export enum ServiceChargeKey {
  SHIPPING_FEE = "SHIPPING_FEE",
  WRAPPING_FEE = "WRAPPING_FEE",
  GRATUITY = "GRATUITY"
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
