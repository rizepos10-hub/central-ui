import { useCallback, useEffect, useRef, useState } from 'react';
import { LabelTemplate, duplicateTemplate } from '../model/label-template.model';
import { isPresetId } from '../model/label-presets';
import { fetchLabelTemplateCatalog, saveLabelTemplateCatalog } from './label-templates.api';
import {
  LabelTemplateCatalog,
  clearLegacyCatalog,
  emptyCatalog,
  mergeCatalog,
  readLegacyCatalog,
  removeStored,
  setDefaultStored,
  upsertStored,
} from './label-templates.storage';

export const useLabelTemplates = () => {
  const catalogRef = useRef<LabelTemplateCatalog>(emptyCatalog());
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((catalog: LabelTemplateCatalog) => {
    catalogRef.current = catalog;
    setTemplates(mergeCatalog(catalog));
  }, []);

  const commit = useCallback(
    (update: (catalog: LabelTemplateCatalog) => LabelTemplateCatalog) => {
      const run = queueRef.current.then(async () => {
        try {
          const saved = await saveLabelTemplateCatalog(update(catalogRef.current));
          clearLegacyCatalog();
          apply(saved);
          setError(null);
          return saved;
        } catch (error) {
          setError('Could not save label templates.');
          throw error;
        }
      });
      queueRef.current = run.catch(() => undefined);
      return run;
    },
    [apply]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let catalog = await fetchLabelTemplateCatalog();
        const legacy = readLegacyCatalog();
        if (legacy && catalog.templates.length === 0 && !catalog.defaultTemplateId) {
          catalog = await saveLabelTemplateCatalog(legacy);
          clearLegacyCatalog();
        }
        if (cancelled) return;
        apply(catalog);
        setError(null);
      } catch {
        if (cancelled) return;
        apply(readLegacyCatalog() ?? emptyCatalog());
        setError('Could not load label templates.');
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const getTemplate = useCallback((id: string) => templates.find(template => template.id === id), [templates]);

  const saveTemplate = useCallback(
    async (template: LabelTemplate) => {
      await commit(catalog => upsertStored(catalog, template));
    },
    [commit]
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      await commit(catalog => removeStored(catalog, id));
    },
    [commit]
  );

  const duplicate = useCallback(
    async (template: LabelTemplate) => {
      const copy = duplicateTemplate(template, `${template.name} Copy`);
      await commit(catalog => upsertStored(catalog, copy));
      return copy;
    },
    [commit]
  );

  const setDefault = useCallback(
    async (id: string) => {
      await commit(catalog => setDefaultStored(catalog, id));
    },
    [commit]
  );

  return { templates, ready, error, getTemplate, saveTemplate, removeTemplate, duplicate, setDefault, isPresetId };
};
