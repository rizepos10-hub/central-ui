import { useCallback, useEffect, useState } from 'react';
import { qzDefaultPrinter, qzListPrinters, qzPrintPdf } from '../print/qz-service';

const SELECTED_PRINTER_KEY = 'retail-label-qz-printer';

export const useQz = () => {
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(() => localStorage.getItem(SELECTED_PRINTER_KEY));

  const refresh = useCallback(async () => {
    setConnecting(true);
    try {
      const list = await qzListPrinters();
      setPrinters(list);
      setAvailable(true);
      if (!localStorage.getItem(SELECTED_PRINTER_KEY)) {
        const def = await qzDefaultPrinter();
        if (def) setSelected(def);
      }
    } catch {
      setAvailable(false);
      setPrinters([]);
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectPrinter = useCallback((name: string | null) => {
    setSelected(name);
    if (name) localStorage.setItem(SELECTED_PRINTER_KEY, name);
    else localStorage.removeItem(SELECTED_PRINTER_KEY);
  }, []);

  return { available, connecting, printers, selected, selectPrinter, refresh, printPdf: qzPrintPdf };
};
