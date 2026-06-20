import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { LabelTemplate } from '../model/label-template.model';
import { LabelDatum, variantKey } from '../util/label-data';

export interface LabelJobEntry {
  key: string;
  datum: LabelDatum;
  copies: number;
}

interface LabelFlowContextValue {
  template: LabelTemplate | null;
  setTemplate: (template: LabelTemplate) => void;
  selection: Map<string, LabelJobEntry>;
  isSelected: (key: string) => boolean;
  toggle: (product: IProduct, variant?: IVariableItemVariant) => void;
  setCopies: (key: string, copies: number) => void;
  clear: () => void;
  entries: LabelJobEntry[];
  totalLabels: number;
  flatLabels: { datum: LabelDatum; copyNum: number; totalCopies: number }[];
}

const LabelFlowContext = createContext<LabelFlowContextValue | null>(null);

export const LabelFlowProvider = ({ children }: { children: React.ReactNode }) => {
  const [template, setTemplate] = useState<LabelTemplate | null>(null);
  const [selection, setSelection] = useState<Map<string, LabelJobEntry>>(new Map());

  const isSelected = useCallback((key: string) => selection.has(key), [selection]);

  const toggle = useCallback((product: IProduct, variant?: IVariableItemVariant) => {
    const key = variantKey(product.id ?? '', variant?.id);
    setSelection(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { key, datum: { product, variant }, copies: 1 });
      }
      return next;
    });
  }, []);

  const setCopies = useCallback((key: string, copies: number) => {
    setSelection(prev => {
      const entry = prev.get(key);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(key, { ...entry, copies: Math.max(1, copies) });
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelection(new Map()), []);

  const entries = useMemo(() => Array.from(selection.values()), [selection]);
  const totalLabels = useMemo(() => entries.reduce((sum, e) => sum + e.copies, 0), [entries]);
  const flatLabels = useMemo(
    () => entries.flatMap(e => Array.from({ length: e.copies }, (_, i) => ({ datum: e.datum, copyNum: i + 1, totalCopies: e.copies }))),
    [entries]
  );

  const value: LabelFlowContextValue = {
    template,
    setTemplate,
    selection,
    isSelected,
    toggle,
    setCopies,
    clear,
    entries,
    totalLabels,
    flatLabels,
  };

  return <LabelFlowContext.Provider value={value}>{children}</LabelFlowContext.Provider>;
};

export const useLabelFlow = (): LabelFlowContextValue => {
  const ctx = useContext(LabelFlowContext);
  if (!ctx) throw new Error('useLabelFlow must be used within LabelFlowProvider');
  return ctx;
};
