import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TriangleAlert, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabelElement, generateLabelId } from '../model/label-template.model';
import { useLabelTemplates } from '../store/useLabelTemplates';
import { createDesignerState, designerReducer } from '../store/designer-reducer';
import { LabelCanvas } from '../components/LabelCanvas';
import { DesignerToolbar } from '../components/designer/DesignerToolbar';
import { ElementPalette } from '../components/designer/ElementPalette';
import { PropertiesPanel } from '../components/designer/PropertiesPanel';
import { useDesignerHotkeys } from '../components/designer/useDesignerHotkeys';
import { findLayoutWarnings, warningElementIds } from '../util/layout-warnings';
import { SAMPLE_DATUM } from '../util/label-data';

const blankTemplate = () => ({
  id: generateLabelId(),
  name: 'New Template',
  description: '',
  widthMm: 50,
  heightMm: 30,
  orientation: 'portrait' as const,
  isDefault: false,
  isActive: true,
  elements: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const DesignerScreen = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { getTemplate, saveTemplate } = useLabelTemplates();

  const initialTemplate = useMemo(() => {
    if (templateId && templateId !== 'new') {
      const found = getTemplate(templateId);
      if (found) return found;
    }
    return blankTemplate();
  }, [templateId, getTemplate]);

  const [state, dispatch] = useReducer(designerReducer, initialTemplate, createDesignerState);
  const { template, selectedElementId, zoom, showGrid, snap, past, future } = state;
  const selected = template.elements.find(e => e.id === selectedElementId) || null;

  const [showSample, setShowSample] = useState(true);
  const savedRef = useRef(false);
  const initialSnapshot = useMemo(() => JSON.stringify(initialTemplate), [initialTemplate]);
  const isDirty = JSON.stringify(template) !== initialSnapshot;

  const warnings = useMemo(() => findLayoutWarnings(template), [template]);
  const warnIds = useMemo(() => warningElementIds(warnings), [warnings]);

  const onSave = useCallback(() => {
    if (template.elements.length === 0) {
      window.alert('Add at least one element before saving.');
      return;
    }
    if (warnings.length > 0) {
      const ok = window.confirm(
        `This template has ${warnings.length} layout issue${warnings.length === 1 ? '' : 's'} ` +
          `(overlapping or off-label elements). Save anyway?`
      );
      if (!ok) return;
    }
    savedRef.current = true;
    saveTemplate({ ...template, name: template.name.trim() || 'Untitled label', updatedAt: new Date().toISOString() });
    navigate('/labels');
  }, [template, warnings, saveTemplate, navigate]);

  const onCancel = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    navigate('/labels');
  }, [isDirty, navigate]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !savedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useDesignerHotkeys({ selectedElementId, dispatch, onSave });

  const handleSelect = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);
  const handleInteractionStart = useCallback(() => dispatch({ type: 'snapshot' }), []);
  const handleMove = useCallback((id: string, dxMm: number, dyMm: number) => dispatch({ type: 'move', id, dxMm, dyMm }), []);
  const handleResize = useCallback(
    (id: string, dWidthMm: number, dHeightMm: number) => dispatch({ type: 'resize', id, dWidthMm, dHeightMm }),
    []
  );
  const handleMoveEnd = useCallback(() => dispatch({ type: 'commitMove' }), []);

  const updateSelected = (patch: Partial<LabelElement>) => {
    if (!selected) return;
    dispatch({ type: 'updateElement', element: { ...selected, ...patch } });
  };

  return (
    <div className="flex h-full flex-col">
      <DesignerToolbar
        template={template}
        zoom={zoom}
        showGrid={showGrid}
        snap={snap}
        showSample={showSample}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        dispatch={dispatch}
        onSave={onSave}
        onCancel={onCancel}
        onToggleSample={() => setShowSample(s => !s)}
      />

      <div className="flex min-h-0 flex-1">
        <ElementPalette template={template} selectedElementId={selectedElementId} warnIds={warnIds} dispatch={dispatch} />

        <div className="flex flex-1 flex-col overflow-hidden">
          {warnings.length > 0 && (
            <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-700">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {warnings.length} layout issue{warnings.length === 1 ? '' : 's'}: {warnings[0].message}
                {warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 gap-1 px-2 text-amber-700 hover:bg-amber-500/20"
                onClick={() => dispatch({ type: 'arrange' })}
              >
                <WandSparkles className="h-3.5 w-3.5" /> Fix
              </Button>
            </div>
          )}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/50 p-8">
            <LabelCanvas
              template={template}
              datum={showSample ? SAMPLE_DATUM : undefined}
              zoom={zoom}
              showGrid={showGrid}
              editMode
              selectedElementId={selectedElementId}
              warnElementIds={warnIds}
              onSelectElement={handleSelect}
              onInteractionStart={handleInteractionStart}
              onMoveElement={handleMove}
              onResizeElement={handleResize}
              onMoveElementEnd={handleMoveEnd}
            />
          </div>
        </div>

        <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-background p-3">
          {selected ? (
            <PropertiesPanel
              element={selected}
              onChange={updateSelected}
              onDuplicate={() => dispatch({ type: 'duplicate', id: selected.id })}
              onDelete={() => dispatch({ type: 'remove', id: selected.id })}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <p>Select an element on the canvas to edit it, or add one from the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignerScreen;
