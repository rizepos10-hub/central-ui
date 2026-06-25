import { MM_TO_PX, PT_PER_MM } from './units';

export interface TextLayoutInput {
  text: string;
  fontSizePt: number;
  bold: boolean;
  widthMm: number;
  heightMm: number;
  autoFit?: boolean;
  minFontPt?: number;
  lineHeight?: number;
  maxLines?: number;
}

export interface TextLayoutResult {
  lines: string[];
  fontSizePt: number;
  truncated: boolean;
  shrunk: boolean;
}

export const DEFAULT_LINE_HEIGHT = 1.15;
export const DEFAULT_MIN_FONT_PT = 5;

let measureCtx: CanvasRenderingContext2D | null | undefined;

const getCtx = (): CanvasRenderingContext2D | null => {
  if (measureCtx !== undefined) return measureCtx;
  measureCtx = null;
  try {
    if (typeof document !== 'undefined') {
      if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
        return null;
      }
      const canvas = document.createElement('canvas');
      measureCtx = canvas.getContext('2d');
    }
  } catch {
    measureCtx = null;
  }
  return measureCtx;
};

export const fontPxFromPt = (pt: number): number => (pt * MM_TO_PX) / PT_PER_MM;

const measureWidth = (text: string, fontPx: number, bold: boolean): number => {
  const ctx = getCtx();
  if (ctx) {
    ctx.font = `${bold ? '700' : '400'} ${fontPx}px Arial, Helvetica, sans-serif`;
    return ctx.measureText(text).width;
  }
  return text.length * fontPx * (bold ? 0.58 : 0.52);
};

const breakLongWord = (word: string, maxPx: number, fontPx: number, bold: boolean): string[] => {
  const chunks: string[] = [];
  let current = '';
  for (const ch of word) {
    const next = current + ch;
    if (current && measureWidth(next, fontPx, bold) > maxPx) {
      chunks.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [word];
};

const wrapText = (text: string, maxPx: number, fontPx: number, bold: boolean): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const fitsAsCandidate = measureWidth(candidate, fontPx, bold) <= maxPx;

      if (fitsAsCandidate) {
        line = candidate;
        continue;
      }

      if (line) {
        lines.push(line);
        line = '';
      }

      if (measureWidth(word, fontPx, bold) > maxPx) {
        const chunks = breakLongWord(word, maxPx, fontPx, bold);
        line = chunks.pop() ?? '';
        for (const chunk of chunks) lines.push(chunk);
      } else {
        line = word;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
};

const ellipsize = (line: string, maxPx: number, fontPx: number, bold: boolean): string => {
  const ellipsis = '…';
  let trimmed = line.replace(/\s+$/, '');
  if (measureWidth(trimmed + ellipsis, fontPx, bold) <= maxPx) return trimmed + ellipsis;
  while (trimmed && measureWidth(trimmed + ellipsis, fontPx, bold) > maxPx) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + ellipsis;
};

const capacityFor = (heightPx: number, fontPx: number, lineHeight: number, maxLines: number): number => {
  const linePx = fontPx * lineHeight;
  let capacity = Math.max(1, Math.floor((heightPx + linePx * 0.08) / linePx));
  if (maxLines > 0) capacity = Math.min(capacity, maxLines);
  return capacity;
};

export const measureTextMm = (text: string, fontSizePt: number, bold: boolean): number =>
  measureWidth(text, fontPxFromPt(fontSizePt), bold) / MM_TO_PX;

export interface CompareFit {
  currentPt: number;
  originalPt: number;
  gapMm: number;
}

export const COMPARE_ORIGINAL_RATIO = 0.64;
const COMPARE_GAP_RATIO = 0.35;

// Shrinks "$20.00 $15.00" so the struck original + sale price fit the box on one line — used by both preview and PDF.
export const fitComparePrice = (
  current: string,
  original: string,
  requestedPt: number,
  widthMm: number,
  heightMm: number,
  options: { autoFit?: boolean; minFontPt?: number } = {}
): CompareFit => {
  const { autoFit = true, minFontPt = DEFAULT_MIN_FONT_PT } = options;
  const floor = Math.max(2, Math.min(minFontPt, requestedPt));
  const byHeight = Math.max(floor, heightMm * PT_PER_MM);
  let pt = Math.min(requestedPt, byHeight);

  const totalWidthAt = (size: number): number =>
    measureTextMm(current, size, true) +
    measureTextMm(original, size * COMPARE_ORIGINAL_RATIO, true) +
    (size / PT_PER_MM) * COMPARE_GAP_RATIO;

  if (autoFit) {
    while (pt > floor && totalWidthAt(pt) > widthMm) {
      pt = Math.max(floor, Math.round((pt - 0.5) * 2) / 2);
    }
  }
  return { currentPt: pt, originalPt: pt * COMPARE_ORIGINAL_RATIO, gapMm: (pt / PT_PER_MM) * COMPARE_GAP_RATIO };
};

// Professional "was / now" price block: the regular price sits small on top (struck through, or spelled
// out as "Was $100.00") and the sale price dominates below in large bold — the layout shoppers recognise
// from retail clearance tags. Geometry is returned in mm so the preview, PDF and thermal raster can each
// scale it into their own units and stay pixel-identical.
export interface ComparePriceLayout {
  nowText: string;
  wasText: string;
  nowPt: number;
  wasPt: number;
  strike: boolean;
  // All offsets are in mm relative to the element box's top-left corner; y values are the baseline-middle.
  nowXMm: number;
  nowYMm: number;
  wasXMm: number;
  wasYMm: number;
  wasWidthMm: number;
}

export type ComparePriceArrangement = 'stacked' | 'inline';

export const COMPARE_WAS_RATIO = 0.62;
const COMPARE_PAIR_GAP_RATIO = 0.16;

export const layoutComparePrice = (
  current: string,
  original: string,
  style: 'strikethrough' | 'was',
  opts: {
    fontSizePt: number;
    widthMm: number;
    heightMm: number;
    alignment: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    autoFit?: boolean;
    minFontPt?: number;
    arrangement?: ComparePriceArrangement;
  }
): ComparePriceLayout => {
  const {
    fontSizePt,
    widthMm,
    heightMm,
    alignment,
    verticalAlign = 'middle',
    autoFit = true,
    minFontPt = DEFAULT_MIN_FONT_PT,
    arrangement = 'stacked',
  } = opts;
  const wasText = style === 'was' ? `Was ${original}` : original;
  const strike = style === 'strikethrough';
  const floor = Math.max(2, Math.min(minFontPt, fontSizePt));
  const xFor = (w: number): number => (alignment === 'center' ? (widthMm - w) / 2 : alignment === 'right' ? widthMm - w : 0);

  if (arrangement === 'inline') {
    // "Was" price and sale price on a single line, side by side: $329.99  $299.99
    const totalWidthMm = (nowPt: number): number =>
      measureTextMm(wasText, nowPt * COMPARE_WAS_RATIO, true) + (nowPt / PT_PER_MM) * COMPARE_PAIR_GAP_RATIO + measureTextMm(current, nowPt, true);

    let nowPt = Math.min(Math.max(floor, fontSizePt), Math.max(floor, heightMm * PT_PER_MM));
    if (autoFit) {
      while (nowPt > floor && totalWidthMm(nowPt) > widthMm) {
        nowPt = Math.max(floor, Math.round((nowPt - 0.5) * 2) / 2);
      }
    }
    const wasPt = nowPt * COMPARE_WAS_RATIO;
    const wWas = measureTextMm(wasText, wasPt, true);
    const wNow = measureTextMm(current, nowPt, true);
    const gap = (nowPt / PT_PER_MM) * COMPARE_PAIR_GAP_RATIO;
    const totalW = wWas + gap + wNow;
    const startX = xFor(totalW);
    const halfNow = nowPt / PT_PER_MM / 2;
    const yMid = verticalAlign === 'top' ? halfNow : verticalAlign === 'bottom' ? heightMm - halfNow : heightMm / 2;

    return {
      nowText: current,
      wasText,
      nowPt,
      wasPt,
      strike,
      wasXMm: startX,
      wasYMm: yMid,
      nowXMm: startX + wWas + gap,
      nowYMm: yMid,
      wasWidthMm: wWas,
    };
  }

  // Stacked: small "was" price on top, large sale price below.
  const blockHeightMm = (nowPt: number): number => {
    const hNow = nowPt / PT_PER_MM;
    const hWas = (nowPt * COMPARE_WAS_RATIO) / PT_PER_MM;
    return hWas + hNow * COMPARE_PAIR_GAP_RATIO + hNow;
  };
  const widthsFit = (nowPt: number): boolean =>
    measureTextMm(current, nowPt, true) <= widthMm && measureTextMm(wasText, nowPt * COMPARE_WAS_RATIO, true) <= widthMm;

  let nowPt = Math.max(floor, fontSizePt);
  if (autoFit) {
    while (nowPt > floor && (blockHeightMm(nowPt) > heightMm || !widthsFit(nowPt))) {
      nowPt = Math.max(floor, Math.round((nowPt - 0.5) * 2) / 2);
    }
  }

  const wasPt = nowPt * COMPARE_WAS_RATIO;
  const hNow = nowPt / PT_PER_MM;
  const hWas = wasPt / PT_PER_MM;
  const gap = hNow * COMPARE_PAIR_GAP_RATIO;
  const blockH = hWas + gap + hNow;
  const topY = verticalAlign === 'top' ? 0 : verticalAlign === 'bottom' ? heightMm - blockH : (heightMm - blockH) / 2;

  const wNow = measureTextMm(current, nowPt, true);
  const wWas = measureTextMm(wasText, wasPt, true);

  return {
    nowText: current,
    wasText,
    nowPt,
    wasPt,
    strike,
    wasXMm: xFor(wWas),
    wasYMm: topY + hWas / 2,
    nowXMm: xFor(wNow),
    nowYMm: topY + hWas + gap + hNow / 2,
    wasWidthMm: wWas,
  };
};

export const layoutLabelText = (input: TextLayoutInput): TextLayoutResult => {
  const {
    text,
    fontSizePt,
    bold,
    widthMm,
    heightMm,
    autoFit = true,
    minFontPt = DEFAULT_MIN_FONT_PT,
    lineHeight = DEFAULT_LINE_HEIGHT,
    maxLines = 0,
  } = input;

  const clean = (text ?? '').toString().replace(/\r\n?/g, '\n');
  if (clean.trim() === '') {
    return { lines: [], fontSizePt, truncated: false, shrunk: false };
  }

  const widthPx = Math.max(widthMm * MM_TO_PX, 1);
  const heightPx = Math.max(heightMm * MM_TO_PX, 1);
  const floor = Math.max(2, Math.min(minFontPt, fontSizePt));

  let pt = fontSizePt;
  let fontPx = fontPxFromPt(pt);
  let wrapped = wrapText(clean, widthPx, fontPx, bold);
  let capacity = capacityFor(heightPx, fontPx, lineHeight, maxLines);
  let shrunk = false;

  if (autoFit) {
    while (wrapped.length > capacity && pt > floor) {
      pt = Math.max(floor, Math.round((pt - 0.5) * 2) / 2);
      fontPx = fontPxFromPt(pt);
      wrapped = wrapText(clean, widthPx, fontPx, bold);
      capacity = capacityFor(heightPx, fontPx, lineHeight, maxLines);
      shrunk = true;
    }
  }

  let truncated = false;
  if (wrapped.length > capacity) {
    const visible = wrapped.slice(0, capacity);
    visible[capacity - 1] = ellipsize(visible[capacity - 1], widthPx, fontPx, bold);
    wrapped = visible;
    truncated = true;
  }

  return { lines: wrapped, fontSizePt: pt, truncated, shrunk };
};
