import {IAttachment} from "app/shared/model/attachment.model";

export interface IStockOrderedItem {
  id?: string; // Variant id
  itemId?: string;
  name?: string;
  variantId?: string;
  variant?: {
    id?: string
    name?: string
  }
  sku?: string;
  itemName?: string;
  price?: number;
  quantity?: number;
  attributeValues?: { [key: string]: AttributeValue };
  attachments?: IAttachment[];
}
interface AttributeValue {
  id?: string;
  name?: string;
  order?: number;
}

export const defaultValue: Readonly<IStockOrderedItem> = {};
