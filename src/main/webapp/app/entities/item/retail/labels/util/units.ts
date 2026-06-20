export const MM_TO_PX = 3.7795275591;

export const PT_PER_MM = 72.0 / 25.4;

export const mmToPx = (mm: number, zoom = 1): number => mm * MM_TO_PX * zoom;

export const scaledFontPx = (fontSizePt: number, zoom: number): number => (fontSizePt * MM_TO_PX * zoom) / PT_PER_MM;

export const snapMm = (value: number, gridMm: number): number => Math.round(value / gridMm) * gridMm;

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const fitZoom = (widthMm: number, heightMm: number, maxWidthPx: number, maxHeightPx: number): number => {
  const naturalW = widthMm * MM_TO_PX;
  const naturalH = heightMm * MM_TO_PX;
  const zoomByWidth = maxWidthPx / naturalW;
  const zoomByHeight = Number.isFinite(maxHeightPx) ? maxHeightPx / naturalH : zoomByWidth;
  return clamp(Math.min(zoomByWidth, zoomByHeight), 0.05, 10);
};
