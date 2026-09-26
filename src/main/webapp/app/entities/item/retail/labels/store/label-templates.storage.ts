import { LabelTemplate, normalizeLabelTemplate } from '../model/label-template.model';
import { DEFAULT_PRESET, LABEL_PRESETS, isPresetId } from '../model/label-presets';

const LEGACY_STORAGE_KEY = 'retail-label-templates';
const LEGACY_DEFAULT_KEY = 'retail-label-default-template';

export interface LabelTemplateCatalog {
  templates: LabelTemplate[];
  defaultTemplateId: string | null;
}

export const emptyCatalog = (): LabelTemplateCatalog => ({ templates: [], defaultTemplateId: null });

export const mergeCatalog = (catalog: LabelTemplateCatalog): LabelTemplate[] => {
  const stored = (catalog.templates ?? []).map(template => normalizeLabelTemplate(template));
  const storedById = new Map(stored.map(template => [template.id, template]));
  const defaultId = catalog.defaultTemplateId || DEFAULT_PRESET.id;

  const merged: LabelTemplate[] = [];
  for (const preset of LABEL_PRESETS) {
    merged.push(normalizeLabelTemplate(storedById.get(preset.id) ?? preset));
    storedById.delete(preset.id);
  }
  for (const custom of stored) {
    if (!isPresetId(custom.id)) merged.push(normalizeLabelTemplate(custom));
  }

  return merged
    .map(template => ({ ...normalizeLabelTemplate(template), isDefault: template.id === defaultId }))
    .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
};

export const upsertStored = (catalog: LabelTemplateCatalog, template: LabelTemplate): LabelTemplateCatalog => {
  const now = new Date().toISOString();
  const next = normalizeLabelTemplate({ ...template, updatedAt: now, createdAt: template.createdAt ?? now });
  const templates = [...(catalog.templates ?? [])];
  const index = templates.findIndex(item => item.id === next.id);
  if (index >= 0) {
    templates[index] = next;
  } else {
    templates.push(next);
  }
  return { templates, defaultTemplateId: catalog.defaultTemplateId ?? null };
};

export const removeStored = (catalog: LabelTemplateCatalog, id: string): LabelTemplateCatalog => {
  if (isPresetId(id)) return catalog;
  const defaultTemplateId = catalog.defaultTemplateId === id ? null : catalog.defaultTemplateId ?? null;
  return {
    templates: (catalog.templates ?? []).filter(template => template.id !== id),
    defaultTemplateId,
  };
};

export const setDefaultStored = (catalog: LabelTemplateCatalog, id: string): LabelTemplateCatalog => ({
  templates: catalog.templates ?? [],
  defaultTemplateId: id,
});

export const readLegacyCatalog = (): LabelTemplateCatalog | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  const defaultId = localStorage.getItem(LEGACY_DEFAULT_KEY);
  if (!raw && !defaultId) return null;

  let templates: LabelTemplate[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      templates = Array.isArray(parsed) ? parsed.map(template => normalizeLabelTemplate(template)) : [];
    } catch {
      templates = [];
    }
  }
  if (templates.length === 0 && !defaultId) return null;
  return { templates, defaultTemplateId: defaultId };
};

export const clearLegacyCatalog = (): void => {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(LEGACY_DEFAULT_KEY);
};
