import { IOrderedAddon } from './ordered-addon.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { IProfileGroup } from '../TAX/profile-group.model';
import { ITaxonomy } from '../taxonomy.model';

export interface IOrderedItem extends IOrderAudit {
  returnedAmount?: number;
  sequenceNumber?: number;
  itemName?: string;
  variantName?: string;
  id?: string;
  itemId?: string;
  price?: number;
  amount?: number;
  discount?: any;
  posAddedDiscount?: any;
  seats?: string;
  addons?: IOrderedAddon[];
  variantId?: string;
  orderId?: string;
  taxValue?: number;
  variantCount?: number;
  selectedRetailAttributes?: orderSelectedRetailAttributes[];
  cartId?: string;
  customDiscount?: number;
  accountingGroups?: IProfileGroup[];
  taxIdsToValues?: any[];
  archived?: boolean;
  total?: number | null,
  addonsTotal?: number | null,
  totalDiscount?: number | null,
}

interface orderSelectedRetailAttributes {
  id: string;
  name: string;
  taxonomy: ITaxonomy;
}

export const defaultValue: Readonly<IOrderedItem> = {};
