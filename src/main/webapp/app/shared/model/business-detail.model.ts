import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddress } from 'app/shared/model/address.model';
import { IBusinessDayDetail } from 'app/shared/model/business-day-detail.model';
export interface IBusinessDetail {
  id?: string;
  businessName?: string;
  logo?: IAttachment;
  slogan?: string;
  address?: IAddress;
  businessDayDetailsByBranch?: { [branchId: string]: Set<IBusinessDayDetail> };
}

export const defaultValue: Readonly<IBusinessDetail> = {};
