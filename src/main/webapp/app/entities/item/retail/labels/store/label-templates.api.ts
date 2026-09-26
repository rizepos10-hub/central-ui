import axios from 'axios';
import { LabelTemplate } from '../model/label-template.model';
import { LabelTemplateCatalog, emptyCatalog } from './label-templates.storage';

const normalizeCatalog = (data: Partial<LabelTemplateCatalog> | null | undefined): LabelTemplateCatalog => ({
  templates: Array.isArray(data?.templates) ? (data.templates as LabelTemplate[]) : [],
  defaultTemplateId: data?.defaultTemplateId ?? null,
});

export const fetchLabelTemplateCatalog = async (): Promise<LabelTemplateCatalog> => {
  const { data } = await axios.get<LabelTemplateCatalog>('/api/label-templates');
  return normalizeCatalog(data);
};

export const saveLabelTemplateCatalog = async (catalog: LabelTemplateCatalog): Promise<LabelTemplateCatalog> => {
  const { data } = await axios.put<LabelTemplateCatalog>('/api/label-templates', {
    templates: catalog.templates ?? [],
    defaultTemplateId: catalog.defaultTemplateId ?? null,
  });
  return normalizeCatalog(data ?? emptyCatalog());
};
