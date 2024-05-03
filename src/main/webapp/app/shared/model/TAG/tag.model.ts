import { ITaxonomy } from "app/shared/model/taxonomy.model";

export interface ITag {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy
}