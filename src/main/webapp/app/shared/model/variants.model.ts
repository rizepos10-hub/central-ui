import { IDiscount } from 'app/shared/model/discount.model';

export interface IVariant {
  name: string;
  price: number;
  discount?: IDiscount[] | null;
}
