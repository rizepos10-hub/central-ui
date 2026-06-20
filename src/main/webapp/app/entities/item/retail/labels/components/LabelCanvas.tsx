import React from 'react';
import { LabelTemplate } from '../model/label-template.model';
import { MM_TO_PX, fitZoom } from '../util/units';
import { LabelDatum } from '../util/label-data';
import { LabelElementView } from './LabelElementView';

type LabelCanvasProps = {
  template: LabelTemplate;
  datum?: LabelDatum;
  zoom?: number;
  showGrid?: boolean;
  gridMm?: number;
  editMode?: boolean;
  selectedElementId?: string | null;
  warnElementIds?: Set<string>;
  useFormattedVariantName?: boolean;
  onSelectElement?: (id: string | null) => void;
  onMoveElement?: (id: string, dxMm: number, dyMm: number) => void;
  onResizeElement?: (id: string, dWidthMm: number, dHeightMm: number) => void;
  onInteractionStart?: () => void;
  onMoveElementEnd?: () => void;
  withShadow?: boolean;
  withBorder?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
};

export const LabelCanvas = ({
  template,
  datum,
  zoom = 1,
  showGrid = false,
  gridMm = 5,
  editMode = false,
  selectedElementId,
  warnElementIds,
  useFormattedVariantName = true,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onInteractionStart,
  onMoveElementEnd,
  withShadow = true,
  withBorder = true,
  innerRef,
}: LabelCanvasProps) => {
  const width = Math.round(template.widthMm * MM_TO_PX * zoom);
  const height = Math.round(template.heightMm * MM_TO_PX * zoom);
  const gridPx = gridMm * MM_TO_PX * zoom;

  return (
    <div
      ref={innerRef}
      onPointerDown={editMode ? () => onSelectElement?.(null) : undefined}
      style={{
        position: 'relative',
        width,
        height,
        background: '#ffffff',
        border: withBorder ? '1px solid #d1d5db' : 'none',
        boxShadow: withShadow ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
        overflow: 'hidden',
        boxSizing: 'border-box',
        flex: '0 0 auto',
      }}
    >
      {showGrid && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.35) 0.5px, transparent 0.5px),' +
              'linear-gradient(to bottom, rgba(148,163,184,0.35) 0.5px, transparent 0.5px)',
            backgroundSize: `${gridPx}px ${gridPx}px`,
            pointerEvents: 'none',
          }}
        />
      )}
      {template.elements
        .filter(e => e.visible)
        .map(e => (
          <LabelElementView
            key={e.id}
            element={e}
            datum={datum}
            zoom={zoom}
            editMode={editMode}
            isSelected={selectedElementId === e.id}
            isWarning={warnElementIds?.has(e.id)}
            useFormattedVariantName={useFormattedVariantName}
            onSelect={onSelectElement}
            onMove={onMoveElement}
            onResize={onResizeElement}
            onInteractionStart={onInteractionStart}
            onMoveEnd={onMoveElementEnd}
          />
        ))}
    </div>
  );
};

type LabelCanvasPreviewProps = {
  template: LabelTemplate;
  datum?: LabelDatum;
  maxWidthPx: number;
  maxHeightPx?: number;
  useFormattedVariantName?: boolean;
  withShadow?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
};

export const LabelCanvasPreview = ({
  template,
  datum,
  maxWidthPx,
  maxHeightPx = Number.POSITIVE_INFINITY,
  useFormattedVariantName = true,
  withShadow = true,
  innerRef,
}: LabelCanvasPreviewProps) => {
  const rawZoom = fitZoom(template.widthMm, template.heightMm, maxWidthPx, maxHeightPx);
  const naturalW = template.widthMm * MM_TO_PX;
  const snappedW = Math.round(naturalW * rawZoom);
  const zoom = snappedW / naturalW;

  return (
    <LabelCanvas
      template={template}
      datum={datum}
      zoom={zoom}
      showGrid={false}
      editMode={false}
      useFormattedVariantName={useFormattedVariantName}
      withShadow={withShadow}
      innerRef={innerRef}
    />
  );
};
