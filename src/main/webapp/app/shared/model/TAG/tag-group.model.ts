import { ITag } from "app/shared/model/TAG/tag.model";

export interface ITagGroup {
  id: string;
  name?: string;
  tags?: ITag[];
}