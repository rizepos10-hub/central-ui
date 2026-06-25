import { Dispatch, useEffect } from 'react';
import { DesignerAction } from '../../store/designer-reducer';

type HotkeyDeps = {
  selectedElementId: string | null;
  dispatch: Dispatch<DesignerAction>;
  onSave: () => void;
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  const tag = el?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el?.isContentEditable);
};

const NUDGES: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export const useDesignerHotkeys = ({ selectedElementId, dispatch, onSave }: HotkeyDeps): void => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const meta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (meta && key === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if (meta && key === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
        return;
      }
      if (meta && key === 's') {
        e.preventDefault();
        onSave();
        return;
      }
      if (!selectedElementId) {
        if (e.key === 'Escape') dispatch({ type: 'select', id: null });
        return;
      }
      if (meta && key === 'd') {
        e.preventDefault();
        dispatch({ type: 'duplicate', id: selectedElementId });
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'remove', id: selectedElementId });
        return;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'select', id: null });
        return;
      }
      const delta = NUDGES[e.key];
      if (delta) {
        e.preventDefault();
        const factor = e.shiftKey ? 5 : 1;
        dispatch({ type: 'nudge', id: selectedElementId, dxMm: delta[0] * factor, dyMm: delta[1] * factor });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElementId, dispatch, onSave]);
};
