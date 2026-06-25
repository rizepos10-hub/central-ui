import React, { useRef } from 'react';
import { LabelElement } from '../model/label-template.model';
import { MM_TO_PX, scaledFontPx } from '../util/units';
import {
  LabelDatum,
  demoBarcodeData,
  elementPlaceholder,
  resolveBarcodeData,
  resolveElementText,
  resolvePriceParts,
  resolveProductImage,
  resolveQrData,
} from '../util/label-data';
import { COMPARE_ORIGINAL_RATIO, DEFAULT_LINE_HEIGHT, DEFAULT_MIN_FONT_PT, fitComparePrice, layoutLabelText } from '../util/text-layout';
import { BarcodeBox, QrBox } from './BarcodeBox';

type LabelElementViewProps = {
  element: LabelElement;
  datum?: LabelDatum;
  zoom: number;
  editMode?: boolean;
  isSelected?: boolean;
  isWarning?: boolean;
  useFormattedVariantName?: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, dxMm: number, dyMm: number) => void;
  onResize?: (id: string, dWidthMm: number, dHeightMm: number) => void;
  onInteractionStart?: () => void;
  onMoveEnd?: () => void;
};

const RESIZE_HANDLE = 10;
const DRAG_THRESHOLD_PX = 3;

export const LabelElementView = React.memo(function LabelElementView({
  element,
  datum,
  zoom,
  editMode = false,
  isSelected = false,
  isWarning = false,
  useFormattedVariantName = true,
  onSelect,
  onMove,
  onResize,
  onInteractionStart,
  onMoveEnd,
}: LabelElementViewProps) {
  const scale = MM_TO_PX * zoom;
  const last = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const resizeLast = useRef<{ x: number; y: number } | null>(null);
  const resized = useRef(false);

  const left = Math.round(element.xMm * scale);
  const top = Math.round(element.yMm * scale);
  const width = Math.round(element.widthMm * scale);
  const height = Math.round(element.heightMm * scale);

  const handlePointerDown = (e: React.PointerEvent) => {
    onSelect?.(element.id);
    if (!editMode || !onMove) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    if (!editMode || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeLast.current = { x: e.clientX, y: e.clientY };
    resized.current = false;
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!onResize || !resizeLast.current) return;
    e.stopPropagation();
    if (!resized.current) {
      if (Math.abs(e.clientX - resizeLast.current.x) < DRAG_THRESHOLD_PX && Math.abs(e.clientY - resizeLast.current.y) < DRAG_THRESHOLD_PX) {
        return;
      }
      resized.current = true;
      onInteractionStart?.();
    }
    const sdx = (e.clientX - resizeLast.current.x) / scale;
    const sdy = (e.clientY - resizeLast.current.y) / scale;
    // Project the screen-space drag onto the element's own (rotated) axes so the handle grows it correctly.
    const rad = ((element.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dw = sdx * cos + sdy * sin;
    const dh = -sdx * sin + sdy * cos;
    resizeLast.current = { x: e.clientX, y: e.clientY };
    onResize(element.id, dw, dh);
  };

  const endResize = (e: React.PointerEvent) => {
    if (!resizeLast.current) return;
    const wasResized = resized.current;
    resizeLast.current = null;
    resized.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (wasResized) onMoveEnd?.();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editMode || !onMove || !last.current) return;
    if (!dragged.current) {
      if (Math.abs(e.clientX - last.current.x) < DRAG_THRESHOLD_PX && Math.abs(e.clientY - last.current.y) < DRAG_THRESHOLD_PX) {
        return;
      }
      dragged.current = true;
      onInteractionStart?.();
    }
    const dx = (e.clientX - last.current.x) / scale;
    const dy = (e.clientY - last.current.y) / scale;
    last.current = { x: e.clientX, y: e.clientY };
    onMove(element.id, dx, dy);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!last.current) return;
    const wasDragged = dragged.current;
    last.current = null;
    dragged.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (wasDragged) onMoveEnd?.();
  };

  const rotation = element.rotation ? `rotate(${element.rotation}deg)` : undefined;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        transform: rotation,
        cursor: editMode ? 'move' : 'default',
        outline:
          isSelected && editMode
            ? '1.5px solid #0ea5e9'
            : isWarning && editMode
            ? '1.5px dashed #ef4444'
            : undefined,
        outlineOffset: 0,
        boxSizing: 'border-box',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <ElementContent
        element={element}
        datum={datum}
        scale={scale}
        width={width}
        height={height}
        useFormattedVariantName={useFormattedVariantName}
      />
      {isSelected && editMode && onResize && (
        <span
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          style={{
            position: 'absolute',
            right: -RESIZE_HANDLE / 2,
            bottom: -RESIZE_HANDLE / 2,
            width: RESIZE_HANDLE,
            height: RESIZE_HANDLE,
            background: '#0ea5e9',
            borderRadius: 2,
            cursor: 'nwse-resize',
            touchAction: 'none',
          }}
        />
      )}
    </div>
  );
});

type ElementContentProps = {
  element: LabelElement;
  datum?: LabelDatum;
  scale: number;
  width: number;
  height: number;
  useFormattedVariantName: boolean;
};

const ElementContent = ({ element, datum, scale, width, height, useFormattedVariantName }: ElementContentProps) => {
  if (element.type === 'barcode') {
    const symbology = element.barcodeSymbology ?? 'code128';
    const data = (datum ? resolveBarcodeData(datum) : '') || demoBarcodeData(symbology);
    return <BarcodeBox data={data} symbology={symbology} alignment={element.alignment} widthPx={width} heightPx={height} scale={scale} />;
  }

  if (element.type === 'qrCode') {
    const data = datum ? resolveQrData(element, datum) : 'SKU-DEMO-001';
    return <QrBox data={data} sizePx={Math.min(width, height)} />;
  }

  if (element.type === 'productImage') {
    const url = datum ? resolveProductImage(datum) : null;
    if (url) {
      return (
        <img
          src={url}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return <ImagePlaceholder size={Math.min(width, height)} />;
  }

  if (element.type === 'logo') {
    if (element.value) {
      return <img src={element.value} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    }
    return <LogoPlaceholder size={Math.min(width, height)} />;
  }

  if (element.type === 'price' && element.showComparePrice && !element.rotation && datum) {
    const { current, original } = resolvePriceParts(datum.variant);
    if (!current) return null;
    if (original) {
      const fit = fitComparePrice(current, original, element.fontSize, element.widthMm, element.heightMm, {
        autoFit: element.autoFit ?? true,
        minFontPt: element.minFontSize ?? DEFAULT_MIN_FONT_PT,
      });
      const curPx = scaledFontPx(fit.currentPt, scale / MM_TO_PX);
      const origPx = curPx * COMPARE_ORIGINAL_RATIO;
      const justify = element.alignment === 'center' ? 'center' : element.alignment === 'right' ? 'flex-end' : 'flex-start';
      const vAlign = element.verticalAlign ?? 'middle';
      const alignItems = vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center';
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems,
            justifyContent: justify,
            gap: fit.gapMm * scale,
            overflow: 'hidden',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <span style={{ fontSize: origPx, color: '#6b7280', textDecoration: 'line-through', whiteSpace: 'nowrap', lineHeight: 1 }}>
            {original}
          </span>
          <span style={{ fontSize: curPx, fontWeight: 700, color: '#000000', whiteSpace: 'nowrap', lineHeight: 1 }}>{current}</span>
        </div>
      );
    }

    const fontPx = scaledFontPx(element.fontSize, scale / MM_TO_PX);
    const vAlign = element.verticalAlign ?? 'middle';
    const alignItems = vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center';
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems,
          justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <span style={{ fontSize: fontPx, fontWeight: 700, color: '#000000', whiteSpace: 'nowrap', lineHeight: 1 }}>{current}</span>
      </div>
    );
  }

  const text = datum ? resolveElementText(element, datum, useFormattedVariantName) : '';
  const isPlaceholder = text.length === 0;
  const display = isPlaceholder ? elementPlaceholder(element) : text;

  if (datum && isPlaceholder && element.type !== 'customText') {
    return null;
  }

  const lineHeight = element.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const layout = layoutLabelText({
    text: display,
    fontSizePt: element.fontSize,
    bold: element.fontBold,
    widthMm: element.widthMm,
    heightMm: element.heightMm,
    autoFit: element.autoFit ?? true,
    minFontPt: element.minFontSize ?? DEFAULT_MIN_FONT_PT,
    lineHeight,
    maxLines: element.maxLines ?? 0,
  });

  const fontPx = scaledFontPx(layout.fontSizePt, scale / MM_TO_PX);
  const vAlign = element.verticalAlign ?? 'middle';
  const justifyV = vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justifyV,
        overflow: 'hidden',
      }}
    >
      {layout.lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: fontPx,
            fontWeight: element.fontBold ? 700 : 400,
            color: isPlaceholder ? '#9ca3af' : '#000000',
            lineHeight,
            textAlign: element.alignment,
            width: '100%',
            whiteSpace: 'pre',
            overflow: 'hidden',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {line.length ? line : ' '}
        </div>
      ))}
    </div>
  );
};

const LogoPlaceholder = ({ size }: { size: number }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#f8fafc',
      border: '1px dashed #cbd5e1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94a3b8',
      fontSize: Math.min(Math.max(size * 0.22, 7), 12),
      fontWeight: 600,
      letterSpacing: 1,
      boxSizing: 'border-box',
    }}
  >
    LOGO
  </div>
);

const ImagePlaceholder = ({ size }: { size: number }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94a3b8',
    }}
  >
    <svg
      width={Math.min(Math.max(size * 0.5, 12), 32)}
      height={Math.min(Math.max(size * 0.5, 12), 32)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  </div>
);
