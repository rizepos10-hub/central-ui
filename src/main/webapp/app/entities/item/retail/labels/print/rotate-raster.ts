
const RASTER_DPI = 600;

export const mmToRasterPx = (mm: number): number => Math.max(1, Math.round((mm / 25.4) * RASTER_DPI));
export const rasterPxToMm = (px: number): number => (px / RASTER_DPI) * 25.4;

export interface ContainRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export const containRect = (
  boxXMm: number,
  boxYMm: number,
  boxWMm: number,
  boxHMm: number,
  naturalW: number,
  naturalH: number
): ContainRect => {
  if (naturalW <= 0 || naturalH <= 0) {
    return { xMm: boxXMm, yMm: boxYMm, widthMm: boxWMm, heightMm: boxHMm };
  }
  const scale = Math.min(boxWMm / naturalW, boxHMm / naturalH);
  const widthMm = naturalW * scale;
  const heightMm = naturalH * scale;
  return {
    xMm: boxXMm + (boxWMm - widthMm) / 2,
    yMm: boxYMm + (boxHMm - heightMm) / 2,
    widthMm,
    heightMm,
  };
};

export interface RotatedRaster {
  dataUrl: string;
  widthMm: number;
  heightMm: number;
}

export const rasterizeRotated = (
  widthMm: number,
  heightMm: number,
  angleDeg: number,
  draw: (ctx: CanvasRenderingContext2D, widthPx: number, heightPx: number) => void
): RotatedRaster | null => {
  if (typeof document === 'undefined') return null;
  const widthPx = mmToRasterPx(widthMm);
  const heightPx = mmToRasterPx(heightMm);

  const base = document.createElement('canvas');
  base.width = widthPx;
  base.height = heightPx;
  const bctx = base.getContext('2d');
  if (!bctx) return null;
  draw(bctx, widthPx, heightPx);

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const boundsW = Math.ceil(widthPx * cos + heightPx * sin);
  const boundsH = Math.ceil(widthPx * sin + heightPx * cos);

  const out = document.createElement('canvas');
  out.width = boundsW;
  out.height = boundsH;
  const octx = out.getContext('2d');
  if (!octx) return null;
  octx.translate(boundsW / 2, boundsH / 2);
  octx.rotate(rad);
  octx.drawImage(base, -widthPx / 2, -heightPx / 2);

  return { dataUrl: out.toDataURL('image/png'), widthMm: rasterPxToMm(boundsW), heightMm: rasterPxToMm(boundsH) };
};

export const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
