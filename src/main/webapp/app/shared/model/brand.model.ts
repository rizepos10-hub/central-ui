import { IAttachment } from "app/shared/model/attachment.model";

export interface IBrand {
  id?: string;
  name?: string;
  logo?: IAttachment;
}
