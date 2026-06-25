import { LabelElement, LabelElementType, LabelTemplate, createElement, generateLabelId } from '../model/label-template.model';
import { PT_PER_MM, clamp, fitZoom, snapMm } from '../util/units';
import { autoArrange } from '../util/layout-warnings';

const fontForHeight = (heightMm: number): number => Math.round(clamp(heightMm * PT_PER_MM * 0.72, 6, 36));

const defaultElementFor = (type: LabelElementType, template: LabelTemplate): LabelElement => {
  const W = template.widthMm;
  const H = template.heightMm;
  const margin = Math.min(2, W * 0.05);
  const innerW = Math.max(W - margin * 2, 5);
  const text = (heightMm: number, extra: Partial<LabelElement> = {}): LabelElement =>
    createElement(type, {
      xMm: margin,
      yMm: margin,
      widthMm: innerW,
      heightMm: clamp(heightMm, 3, H - margin),
      fontSize: fontForHeight(clamp(heightMm, 3, H - margin)),
      ...extra,
    });

  switch (type) {
    case 'productName':
      return text(clamp(H * 0.18, 4, 9), { fontBold: true, alignment: 'left' });
    case 'price':
      return text(clamp(H * 0.22, 5, 16), { fontBold: true, alignment: 'center' });
    case 'sku':
      return text(clamp(H * 0.12, 3, 5), { alignment: 'left' });
    case 'category':
    case 'brand':
      return text(clamp(H * 0.12, 3, 6));
    case 'description':
      return text(clamp(H * 0.16, 4, 8));
    case 'customText':
      return text(clamp(H * 0.14, 4, 7), { alignment: 'center' });
    case 'barcode': {
      const h = clamp(H * 0.4, 8, Math.max(8, H - margin * 2));
      const w = Math.min(innerW, W * 0.85);
      return createElement(type, {
        xMm: (W - w) / 2,
        yMm: margin,
        widthMm: w,
        heightMm: h,
        alignment: 'center',
      });
    }
    case 'qrCode': {
      const side = clamp(Math.min(innerW, H) * 0.6, 10, Math.min(innerW, H - margin));
      return createElement(type, { xMm: margin, yMm: margin, widthMm: side, heightMm: side, alignment: 'center' });
    }
    case 'productImage': {
      const side = clamp(Math.min(innerW, H) * 0.5, 8, Math.min(innerW, H - margin));
      return createElement(type, { xMm: margin, yMm: margin, widthMm: side, heightMm: side });
    }
    case 'logo': {
      const w = clamp(Math.min(innerW, W * 0.4), 8, innerW);
      const h = clamp(Math.min(H * 0.3, w * 0.5), 6, H - margin);
      return createElement(type, { xMm: margin, yMm: margin, widthMm: w, heightMm: h });
    }
    default:
      return text(clamp(H * 0.14, 4, 7));
  }
};

export interface DesignerState {
  template: LabelTemplate;
  selectedElementId: string | null;
  zoom: number;
  showGrid: boolean;
  snap: boolean;
  gridMm: number;
  past: LabelTemplate[];
  future: LabelTemplate[];
}

export type DesignerAction =
  | { type: 'snapshot' }
  | { type: 'select'; id: string | null }
  | { type: 'add'; elementType: LabelElementType }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'move'; id: string; dxMm: number; dyMm: number }
  | { type: 'nudge'; id: string; dxMm: number; dyMm: number }
  | { type: 'reorder'; id: string; dir: 'forward' | 'backward' }
  | { type: 'commitMove' }
  | { type: 'resize'; id: string; dWidthMm: number; dHeightMm: number }
  | { type: 'updateElement'; element: LabelElement }
  | { type: 'updateTemplate'; patch: Partial<LabelTemplate> }
  | { type: 'arrange' }
  | { type: 'setZoom'; zoom: number }
  | { type: 'toggleGrid' }
  | { type: 'toggleSnap' }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 50;

const initialZoomFor = (template: LabelTemplate): number => {
  const raw = fitZoom(template.widthMm, template.heightMm, 560, 400);
  return clamp(Math.round(raw * 4) / 4, 1, 5);
};

export const createDesignerState = (template: LabelTemplate): DesignerState => ({
  template,
  selectedElementId: null,
  zoom: initialZoomFor(template),
  showGrid: true,
  snap: true,
  gridMm: 1,
  past: [],
  future: [],
});

const pushHistory = (state: DesignerState): Pick<DesignerState, 'past' | 'future'> => ({
  past: [...state.past, state.template].slice(-MAX_HISTORY),
  future: [],
});

const mapElements = (template: LabelTemplate, fn: (e: LabelElement) => LabelElement): LabelTemplate => ({
  ...template,
  elements: template.elements.map(fn),
});

// Axis-aligned bounding box of an element after it is rotated about its center.
const rotatedExtent = (widthMm: number, heightMm: number, rotation: number): { eW: number; eH: number } => {
  const rad = ((rotation || 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return { eW: widthMm * c + heightMm * s, eH: widthMm * s + heightMm * c };
};

// Clamp the (unrotated) top-left so the element's *rotated* footprint stays inside the label.
const clampPosition = (xMm: number, yMm: number, e: LabelElement, tW: number, tH: number): { xMm: number; yMm: number } => {
  const { eW, eH } = rotatedExtent(e.widthMm, e.heightMm, e.rotation);
  const cx = xMm + e.widthMm / 2;
  const cy = yMm + e.heightMm / 2;
  const clampCenter = (c: number, ext: number, total: number) => (ext >= total ? total / 2 : clamp(c, ext / 2, total - ext / 2));
  return {
    xMm: clampCenter(cx, eW, tW) - e.widthMm / 2,
    yMm: clampCenter(cy, eH, tH) - e.heightMm / 2,
  };
};

// How big the unrotated box may be so its rotated footprint still fits (handles the 0/90/180/270 cases exactly).
const sizeCapacity = (rotation: number, tW: number, tH: number): { maxW: number; maxH: number } => {
  const r = ((Math.round(rotation || 0) % 360) + 360) % 360;
  if (r === 90 || r === 270) return { maxW: tH, maxH: tW };
  if (r === 0 || r === 180) return { maxW: tW, maxH: tH };
  const m = Math.min(tW, tH);
  return { maxW: m, maxH: m };
};

const clampIntoBounds = (e: LabelElement, widthMm: number, heightMm: number): LabelElement => {
  const { maxW, maxH } = sizeCapacity(e.rotation, widthMm, heightMm);
  const w = clamp(e.widthMm, 2, maxW);
  const h = clamp(e.heightMm, 2, maxH);
  const sized = { ...e, widthMm: w, heightMm: h };
  return { ...sized, ...clampPosition(e.xMm, e.yMm, sized, widthMm, heightMm) };
};

export const designerReducer = (state: DesignerState, action: DesignerAction): DesignerState => {
  switch (action.type) {
    case 'snapshot':
      return { ...state, ...pushHistory(state) };

    case 'select':
      return { ...state, selectedElementId: action.id };

    case 'add': {
      const element = defaultElementFor(action.elementType, state.template);
      return {
        ...state,
        ...pushHistory(state),
        template: { ...state.template, elements: [...state.template.elements, element] },
        selectedElementId: element.id,
      };
    }

    case 'remove':
      return {
        ...state,
        ...pushHistory(state),
        template: { ...state.template, elements: state.template.elements.filter(e => e.id !== action.id) },
        selectedElementId: null,
      };

    case 'duplicate': {
      const original = state.template.elements.find(e => e.id === action.id);
      if (!original) return state;
      const copy = clampIntoBounds(
        { ...original, id: generateLabelId(), xMm: original.xMm + 3, yMm: original.yMm + 3 },
        state.template.widthMm,
        state.template.heightMm
      );
      return {
        ...state,
        ...pushHistory(state),
        template: { ...state.template, elements: [...state.template.elements, copy] },
        selectedElementId: copy.id,
      };
    }

    case 'move': {
      const el = state.template.elements.find(e => e.id === action.id);
      if (!el) return state;
      const pos = clampPosition(el.xMm + action.dxMm, el.yMm + action.dyMm, el, state.template.widthMm, state.template.heightMm);
      return { ...state, template: mapElements(state.template, e => (e.id === action.id ? { ...e, ...pos } : e)) };
    }

    case 'nudge': {
      const el = state.template.elements.find(e => e.id === action.id);
      if (!el) return state;
      const pos = clampPosition(el.xMm + action.dxMm, el.yMm + action.dyMm, el, state.template.widthMm, state.template.heightMm);
      if (pos.xMm === el.xMm && pos.yMm === el.yMm) return state;
      return {
        ...state,
        ...pushHistory(state),
        template: mapElements(state.template, e => (e.id === action.id ? { ...e, ...pos } : e)),
      };
    }

    case 'reorder': {
      const index = state.template.elements.findIndex(e => e.id === action.id);
      if (index === -1) return state;
      const target = action.dir === 'forward' ? index + 1 : index - 1;
      if (target < 0 || target >= state.template.elements.length) return state;
      const elements = [...state.template.elements];
      [elements[index], elements[target]] = [elements[target], elements[index]];
      return { ...state, ...pushHistory(state), template: { ...state.template, elements } };
    }

    case 'commitMove': {
      if (!state.snap || !state.selectedElementId) return state;
      const id = state.selectedElementId;
      const el = state.template.elements.find(e => e.id === id);
      if (!el) return state;
      const pos = clampPosition(snapMm(el.xMm, state.gridMm), snapMm(el.yMm, state.gridMm), el, state.template.widthMm, state.template.heightMm);
      return { ...state, template: mapElements(state.template, e => (e.id === id ? { ...e, ...pos } : e)) };
    }

    case 'resize': {
      const el = state.template.elements.find(e => e.id === action.id);
      if (!el) return state;
      const { widthMm: tW, heightMm: tH } = state.template;
      const rot = ((Math.round(el.rotation || 0) % 360) + 360) % 360;

      if (rot === 0 || rot === 180) {
        // Unrotated: keep the top-left anchored and grow into the space that remains.
        const newW = clamp(el.widthMm + action.dWidthMm, 5, tW - el.xMm);
        const newH = clamp(el.heightMm + action.dHeightMm, 3, tH - el.yMm);
        return { ...state, template: mapElements(state.template, e => (e.id === action.id ? { ...e, widthMm: newW, heightMm: newH } : e)) };
      }

      // Rotated: size against the rotation-aware capacity, then re-clamp the position so the footprint stays inside.
      const { maxW, maxH } = sizeCapacity(el.rotation, tW, tH);
      const sized = { ...el, widthMm: clamp(el.widthMm + action.dWidthMm, 5, maxW), heightMm: clamp(el.heightMm + action.dHeightMm, 3, maxH) };
      const pos = clampPosition(el.xMm, el.yMm, sized, tW, tH);
      return { ...state, template: mapElements(state.template, e => (e.id === action.id ? { ...sized, ...pos } : e)) };
    }

    case 'updateElement':
      return {
        ...state,
        ...pushHistory(state),
        template: mapElements(state.template, e => (e.id === action.element.id ? action.element : e)),
      };

    case 'updateTemplate': {
      const merged = { ...state.template, ...action.patch };
      const dimsChanged = merged.widthMm !== state.template.widthMm || merged.heightMm !== state.template.heightMm;
      const template = dimsChanged
        ? { ...merged, elements: merged.elements.map(e => clampIntoBounds(e, merged.widthMm, merged.heightMm)) }
        : merged;
      return { ...state, ...pushHistory(state), template };
    }

    case 'arrange':
      return { ...state, ...pushHistory(state), template: autoArrange(state.template) };

    case 'setZoom':
      return { ...state, zoom: clamp(action.zoom, 0.5, 6) };

    case 'toggleGrid':
      return { ...state, showGrid: !state.showGrid };

    case 'toggleSnap':
      return { ...state, snap: !state.snap };

    case 'undo': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        template: previous,
        past: state.past.slice(0, -1),
        future: [state.template, ...state.future],
        selectedElementId: null,
      };
    }

    case 'redo': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        template: next,
        past: [...state.past, state.template],
        future: state.future.slice(1),
        selectedElementId: null,
      };
    }

    default:
      return state;
  }
};
