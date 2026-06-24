import qz from 'qz-tray';

let configured = false;

const configure = () => {
  if (configured) return;
  configured = true;
  qz.security.setCertificatePromise((resolve: (v?: unknown) => void) => resolve());
  qz.security.setSignaturePromise(() => (resolve: (v?: unknown) => void) => resolve());
};

export const qzConnect = async (): Promise<void> => {
  configure();
  if (qz.websocket.isActive()) return;
  await qz.websocket.connect({ retries: 1, delay: 1 });
};

export const qzIsActive = (): boolean => {
  try {
    return qz.websocket.isActive();
  } catch {
    return false;
  }
};

export const qzListPrinters = async (): Promise<string[]> => {
  await qzConnect();
  const found = await qz.printers.find();
  return Array.isArray(found) ? found : found ? [found] : [];
};

export const qzDefaultPrinter = async (): Promise<string | null> => {
  await qzConnect();
  try {
    return await qz.printers.getDefault();
  } catch {
    return null;
  }
};

export const qzPrintPdf = async (printer: string, base64: string, size: { widthMm: number; heightMm: number }): Promise<void> => {
  await qzConnect();
  const orientation = size.widthMm >= size.heightMm ? 'landscape' : 'portrait';
  const config = qz.configs.create(printer, {
    units: 'mm',
    size: { width: size.widthMm, height: size.heightMm },
    margins: 0,
    scaleContent: false,
    rasterize: false,
    density: 300,
    orientation,
  });
  await qz.print(config, [{ type: 'pixel', format: 'pdf', flavor: 'base64', data: base64 }]);
};
