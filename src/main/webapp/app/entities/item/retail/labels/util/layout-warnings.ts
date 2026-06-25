import { LabelTemplate, LabelElement, ELEMENT_TYPE_LABELS } from '../model/label-template.model';
import { clamp } from './units';

export interface LayoutWarning {
  id: string;
  label: string;
  kind: 'overlap' | 'outOfBounds';
  message: string;
}

const EPS = 0.05;

// Axis-aligned bounding box of an element once it is rotated about its centre.
const extentOf = (e: LabelElement): { eW: number; eH: number } => {
  const rad = ((e.rotation || 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return { eW: e.widthMm * c + e.heightMm * s, eH: e.widthMm * s + e.heightMm * c };
};

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const footprint = (e: LabelElement): Box => {
  const { eW, eH } = extentOf(e);
  const cx = e.xMm + e.widthMm / 2;
  const cy = e.yMm + e.heightMm / 2;
  return { x1: cx - eW / 2, y1: cy - eH / 2, x2: cx + eW / 2, y2: cy + eH / 2 };
};

const overlaps = (a: LabelElement, b: LabelElement): boolean => {
  const fa = footprint(a);
  const fb = footprint(b);
  const ix = Math.max(0, Math.min(fa.x2, fb.x2) - Math.max(fa.x1, fb.x1));
  const iy = Math.max(0, Math.min(fa.y2, fb.y2) - Math.max(fa.y1, fb.y1));
  return ix > EPS && iy > EPS;
};

const outOfBounds = (e: LabelElement, template: LabelTemplate): boolean => {
  const f = footprint(e);
  return f.x1 < -EPS || f.y1 < -EPS || f.x2 > template.widthMm + EPS || f.y2 > template.heightMm + EPS;
};

export const findLayoutWarnings = (template: LabelTemplate): LayoutWarning[] => {
  const elements = template.elements.filter(e => e.visible);
  const warnings: LayoutWarning[] = [];
  const overlapIds = new Set<string>();

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (overlaps(elements[i], elements[j])) {
        overlapIds.add(elements[i].id);
        overlapIds.add(elements[j].id);
      }
    }
  }

  for (const e of elements) {
    if (outOfBounds(e, template)) {
      warnings.push({
        id: e.id,
        label: ELEMENT_TYPE_LABELS[e.type],
        kind: 'outOfBounds',
        message: `${ELEMENT_TYPE_LABELS[e.type]} extends outside the label`,
      });
    }
  }

  for (const e of elements) {
    if (overlapIds.has(e.id)) {
      warnings.push({
        id: e.id,
        label: ELEMENT_TYPE_LABELS[e.type],
        kind: 'overlap',
        message: `${ELEMENT_TYPE_LABELS[e.type]} overlaps another element`,
      });
    }
  }

  return warnings;
};

export const warningElementIds = (warnings: LayoutWarning[]): Set<string> => new Set(warnings.map(w => w.id));

const isFlat = (e: LabelElement): boolean => ((((Math.round(e.rotation || 0) % 360) + 360) % 360) % 180) === 0;

// Move an element so its rotated footprint sits fully inside the label, keeping its size.
const clampFootprint = (e: LabelElement, template: LabelTemplate): LabelElement => {
  const { eW, eH } = extentOf(e);
  const cx = clamp(e.xMm + e.widthMm / 2, eW / 2, Math.max(eW / 2, template.widthMm - eW / 2));
  const cy = clamp(e.yMm + e.heightMm / 2, eH / 2, Math.max(eH / 2, template.heightMm - eH / 2));
  return { ...e, xMm: cx - e.widthMm / 2, yMm: cy - e.heightMm / 2 };
};

/**
 * Tidies a label: rotated elements keep their place (clamped inside) so side-text stays where the
 * user put it, and the remaining flat elements are stacked top-to-bottom in the space left over.
 */
export const autoArrange = (template: LabelTemplate): LabelTemplate => {
  const margin = Math.min(2, template.widthMm * 0.05, template.heightMm * 0.05);
  const gap = Math.min(1, margin);
  const innerW = Math.max(template.widthMm - margin * 2, 4);
  const innerH = Math.max(template.heightMm - margin * 2, 2);

  // Keep rotated (side) elements: shrink any that are too big for the label, then pull them inside.
  const rotated = template.elements
    .filter(e => !isFlat(e))
    .map(e => {
      const { eW, eH } = extentOf(e);
      const fit = Math.min(1, innerW / eW, innerH / eH);
      const sized = fit < 1 ? { ...e, widthMm: Math.max(2, e.widthMm * fit), heightMm: Math.max(2, e.heightMm * fit) } : e;
      return clampFootprint(sized, template);
    });

  // Reserve the horizontal space those rotated elements occupy against the left/right edges.
  let freeL = margin;
  let freeR = template.widthMm - margin;
  for (const e of rotated) {
    const f = footprint(e);
    const cx = (f.x1 + f.x2) / 2;
    if (cx >= template.widthMm / 2) freeR = Math.min(freeR, f.x1 - gap);
    else freeL = Math.max(freeL, f.x2 + gap);
  }
  const bandW = Math.max(freeR - freeL, 4);

  const flat = template.elements.filter(isFlat).sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm);

  const place = (scale: number): { elements: LabelElement[]; used: number } => {
    let cursorY = margin;
    const elements = flat.map(e => {
      const widthMm = Math.min(e.widthMm, bandW);
      const heightMm = Math.min(e.heightMm * scale, innerH);
      const slack = bandW - widthMm;
      const offsetX = e.alignment === 'left' ? 0 : e.alignment === 'right' ? slack : slack / 2;
      const placed: LabelElement = { ...e, xMm: freeL + offsetX, yMm: cursorY, widthMm, heightMm };
      cursorY += heightMm + gap * scale;
      return placed;
    });
    return { elements, used: cursorY - gap * scale - margin };
  };

  let stacked = place(1);
  if (stacked.used > innerH && flat.length > 0) {
    const totalGaps = gap * Math.max(0, flat.length - 1);
    const totalBoxes = stacked.used - totalGaps;
    const scale = Math.max(0.1, (innerH - totalGaps) / Math.max(totalBoxes, 1));
    stacked = place(scale);
  }

  const byId = new Map<string, LabelElement>();
  rotated.forEach(e => byId.set(e.id, e));
  stacked.elements.forEach(e => byId.set(e.id, e));
  return { ...template, elements: template.elements.map(e => byId.get(e.id) ?? e) };
};
