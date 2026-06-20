import React, { Dispatch } from 'react';
import { Check, FlaskConical, Grid3x3, Magnet, Redo2, RotateCw, Undo2, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COMMON_LABEL_SIZES, LabelTemplate } from '../../model/label-template.model';
import { DesignerAction } from '../../store/designer-reducer';
import { clamp } from '../../util/units';

type DesignerToolbarProps = {
  template: LabelTemplate;
  zoom: number;
  showGrid: boolean;
  snap: boolean;
  showSample: boolean;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: Dispatch<DesignerAction>;
  onSave: () => void;
  onCancel: () => void;
  onToggleSample: () => void;
};

export const DesignerToolbar = ({
  template,
  zoom,
  showGrid,
  snap,
  showSample,
  canUndo,
  canRedo,
  dispatch,
  onSave,
  onCancel,
  onToggleSample,
}: DesignerToolbarProps) => {
  const applySize = (name: string) => {
    const size = COMMON_LABEL_SIZES.find(s => s.name === name);
    if (size) dispatch({ type: 'updateTemplate', patch: { widthMm: size.widthMm, heightMm: size.heightMm } });
  };

  const swapOrientation = () =>
    dispatch({
      type: 'updateTemplate',
      patch: {
        widthMm: template.heightMm,
        heightMm: template.widthMm,
        orientation: template.heightMm >= template.widthMm ? 'landscape' : 'portrait',
      },
    });

  const selectedSize = COMMON_LABEL_SIZES.find(s => s.widthMm === template.widthMm && s.heightMm === template.heightMm)?.name ?? '';

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2">
      <Button variant="ghost" size="sm" className="gap-1" onClick={onCancel}>
        <X className="h-4 w-4" /> Cancel
      </Button>
      <Input
        value={template.name}
        onChange={e => dispatch({ type: 'updateTemplate', patch: { name: e.target.value } })}
        className="h-8 w-44 text-sm font-semibold"
        placeholder="Template name"
      />
      <select
        value={selectedSize}
        onChange={e => applySize(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
        title="Common label sizes"
      >
        <option value="">Custom size…</option>
        {COMMON_LABEL_SIZES.map(s => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>W</span>
        <Input
          type="number"
          min={5}
          value={template.widthMm}
          onChange={e => dispatch({ type: 'updateTemplate', patch: { widthMm: clamp(Number(e.target.value) || 1, 5, 500) } })}
          className="h-8 w-16 text-xs"
        />
        <span>×</span>
        <span>H</span>
        <Input
          type="number"
          min={5}
          value={template.heightMm}
          onChange={e => dispatch({ type: 'updateTemplate', patch: { heightMm: clamp(Number(e.target.value) || 1, 5, 500) } })}
          className="h-8 w-16 text-xs"
        />
        <span>mm</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Swap width / height" onClick={swapOrientation}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconToggle active={showSample} title="Preview with sample product data" onClick={onToggleSample}>
          <FlaskConical className="h-4 w-4" />
        </IconToggle>
        <IconToggle active={showGrid} title="Grid" onClick={() => dispatch({ type: 'toggleGrid' })}>
          <Grid3x3 className="h-4 w-4" />
        </IconToggle>
        <IconToggle active={snap} title="Snap to grid" onClick={() => dispatch({ type: 'toggleSnap' })}>
          <Magnet className="h-4 w-4" />
        </IconToggle>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom out" onClick={() => dispatch({ type: 'setZoom', zoom: zoom - 0.5 })}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom in" onClick={() => dispatch({ type: 'setZoom', zoom: zoom + 0.5 })}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          title="Stack all elements neatly without overlaps"
          onClick={() => dispatch({ type: 'arrange' })}
        >
          <WandSparkles className="h-4 w-4" /> Auto-arrange
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Undo" disabled={!canUndo} onClick={() => dispatch({ type: 'undo' })}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Redo" disabled={!canRedo} onClick={() => dispatch({ type: 'redo' })}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button className="ml-1 h-8 gap-1" onClick={onSave}>
          <Check className="h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
};

const IconToggle = ({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button variant={active ? 'default' : 'ghost'} size="icon" className="h-8 w-8" title={title} onClick={onClick}>
    {children}
  </Button>
);
