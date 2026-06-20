import { useCallback, useState } from 'react';
import { LabelTemplate, duplicateTemplate } from '../model/label-template.model';
import { isPresetId } from '../model/label-presets';
import {
  deleteTemplate as deleteTemplateStorage,
  getTemplate as getTemplateStorage,
  listTemplates,
  saveTemplate as saveTemplateStorage,
  setDefaultTemplateId,
} from './label-templates.storage';

export const useLabelTemplates = () => {
  const [templates, setTemplates] = useState<LabelTemplate[]>(() => listTemplates());

  const refresh = useCallback(() => setTemplates(listTemplates()), []);

  const getTemplate = useCallback((id: string) => getTemplateStorage(id), []);

  const saveTemplate = useCallback(
    (template: LabelTemplate) => {
      saveTemplateStorage(template);
      refresh();
    },
    [refresh]
  );

  const removeTemplate = useCallback(
    (id: string) => {
      deleteTemplateStorage(id);
      refresh();
    },
    [refresh]
  );

  const duplicate = useCallback(
    (template: LabelTemplate) => {
      const copy = duplicateTemplate(template, `${template.name} Copy`);
      saveTemplateStorage(copy);
      refresh();
      return copy;
    },
    [refresh]
  );

  const setDefault = useCallback(
    (id: string) => {
      setDefaultTemplateId(id);
      refresh();
    },
    [refresh]
  );

  return { templates, refresh, getTemplate, saveTemplate, removeTemplate, duplicate, setDefault, isPresetId };
};
