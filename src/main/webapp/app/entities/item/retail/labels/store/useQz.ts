import { useCallback, useEffect, useState } from 'react';
import { qzDefaultPrinter, qzListPrinters, qzPrintPdf } from '../print/qz-service';
import { PrinterOffset, SYSTEM_DIALOG_KEY, ZERO_OFFSET, getPrinterOffset, setPrinterOffset } from '../print/printer-calibration';

const SELECTED_PRINTER_KEY = 'retail-label-qz-printer';

// When QZ direct-printing is unavailable the user prints through the OS dialog, so there is no
// printer name to key on — fall back to a shared calibration slot for that path.
const offsetKeyFor = (name: string | null): string => name ?? SYSTEM_DIALOG_KEY;

export const useQz = () => {
  const [available, setAvailable] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(() => localStorage.getItem(SELECTED_PRINTER_KEY));
  const [offset, setOffset] = useState<PrinterOffset>(() => getPrinterOffset(offsetKeyFor(localStorage.getItem(SELECTED_PRINTER_KEY))));

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
    setOffset(getPrinterOffset(offsetKeyFor(name)));
    if (name) localStorage.setItem(SELECTED_PRINTER_KEY, name);
    else localStorage.removeItem(SELECTED_PRINTER_KEY);
  }, []);

  const updateOffset = useCallback(
    (next: PrinterOffset) => {
      setOffset(setPrinterOffset(offsetKeyFor(selected), next));
    },
    [selected]
  );

  const resetOffset = useCallback(() => updateOffset(ZERO_OFFSET), [updateOffset]);

  return { available, connecting, printers, selected, selectPrinter, refresh, printPdf: qzPrintPdf, offset, updateOffset, resetOffset };
};
