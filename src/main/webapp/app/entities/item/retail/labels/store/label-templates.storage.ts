import { LabelTemplate } from '../model/label-template.model';
import { DEFAULT_PRESET, LABEL_PRESETS, isPresetId } from '../model/label-presets';

const STORAGE_KEY = 'retail-label-templates';
const DEFAULT_KEY = 'retail-label-default-template';

const readStored = (): LabelTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LabelTemplate[]) : [];
  } catch {
    return [];
  }
};

const writeStored = (templates: LabelTemplate[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const getDefaultTemplateId = (): string => {
  const stored = localStorage.getItem(DEFAULT_KEY);
  if (stored) return stored;
  return DEFAULT_PRESET.id;
};

export const setDefaultTemplateId = (id: string): void => {
  localStorage.setItem(DEFAULT_KEY, id);
};

export const listTemplates = (): LabelTemplate[] => {
  const stored = readStored();
  const storedById = new Map(stored.map(t => [t.id, t]));
  const defaultId = getDefaultTemplateId();

  const merged: LabelTemplate[] = [];
  for (const preset of LABEL_PRESETS) {
    merged.push(storedById.get(preset.id) ?? preset);
    storedById.delete(preset.id);
  }
  for (const custom of stored) {
    if (!isPresetId(custom.id)) merged.push(custom);
  }

  return merged.map(t => ({ ...t, isDefault: t.id === defaultId }));
};

export const getTemplate = (id: string): LabelTemplate | undefined => listTemplates().find(t => t.id === id);

export const saveTemplate = (template: LabelTemplate): void => {
  const now = new Date().toISOString();
  const stored = readStored();
  const index = stored.findIndex(t => t.id === template.id);
  const next: LabelTemplate = { ...template, updatedAt: now, createdAt: template.createdAt ?? now };
  if (index >= 0) {
    stored[index] = next;
  } else {
    stored.push(next);
  }
  writeStored(stored);
};

export const deleteTemplate = (id: string): void => {
  if (isPresetId(id)) return;
  writeStored(readStored().filter(t => t.id !== id));
  if (getDefaultTemplateId() === id) localStorage.removeItem(DEFAULT_KEY);
};
