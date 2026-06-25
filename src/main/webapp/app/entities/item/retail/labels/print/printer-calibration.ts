export interface PrinterOffset {
  xMm: number;
  yMm: number;
}

export const ZERO_OFFSET: PrinterOffset = { xMm: 0, yMm: 0 };

// Used as the calibration key for the browser / system print dialog, where the app cannot know
// which printer the user will pick in the OS dialog. Lets that path still carry an alignment nudge.
export const SYSTEM_DIALOG_KEY = '__system-dialog__';

const STORAGE_KEY = 'retail-label-printer-offsets';
const MAX_OFFSET_MM = 30;

const clampOffset = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, -MAX_OFFSET_MM), MAX_OFFSET_MM);
};

const readAll = (): Record<string, PrinterOffset> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeAll = (all: Record<string, PrinterOffset>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / disabled storage */
  }
};

export const getPrinterOffset = (printer: string | null): PrinterOffset => {
  if (!printer) return ZERO_OFFSET;
  const stored = readAll()[printer];
  if (!stored) return ZERO_OFFSET;
  return { xMm: clampOffset(stored.xMm), yMm: clampOffset(stored.yMm) };
};

export const setPrinterOffset = (printer: string, offset: PrinterOffset): PrinterOffset => {
  const next: PrinterOffset = { xMm: clampOffset(offset.xMm), yMm: clampOffset(offset.yMm) };
  const all = readAll();
  if (next.xMm === 0 && next.yMm === 0) {
    delete all[printer];
  } else {
    all[printer] = next;
  }
  writeAll(all);
  return next;
};
