// Keep in sync with cloud_pos lib/models/printing/printer_model.dart (ids are derived the same way)

export type PrinterFont = 'A' | 'B' | 'COURIER_10' | 'COURIER_12' | 'COURIER_17';
export type PrinterCommandMode = 'ESC_POS' | 'STAR_LINE' | 'WINDOWS_DRIVER';
type Size = 'mm58' | 'mm72' | 'mm80';

interface Geometry {
  size: Size;
  fontA: number;
  fontB: number;
  impact?: boolean;
}

const G: Record<'t80' | 't80n' | 't72' | 't58' | 'i76' | 's76', Geometry> = {
  t80: { size: 'mm80', fontA: 48, fontB: 64 },
  t80n: { size: 'mm80', fontA: 42, fontB: 56 },
  t72: { size: 'mm72', fontA: 42, fontB: 56 },
  t58: { size: 'mm58', fontA: 32, fontB: 42 },
  i76: { size: 'mm80', fontA: 40, fontB: 33, impact: true },
  s76: { size: 'mm80', fontA: 42, fontB: 35, impact: true },
};

export interface IPrinterModel {
  id: string;
  brand: string;
  name: string;
  label: string;
  size: Size;
  fontAColumns: number;
  fontBColumns: number;
  star: boolean;
  twoColor: boolean;
  impact: boolean;
}

const m = (brand: string, name: string, g: Geometry, opts: { star?: boolean; red?: boolean } = {}): IPrinterModel => ({
  id: `${brand}_${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
  brand,
  name,
  label: `${brand} ${name}`,
  size: g.size,
  fontAColumns: g.fontA,
  fontBColumns: g.fontB,
  star: opts.star === true,
  twoColor: opts.red === true,
  impact: g.impact === true,
});

const star = { star: true };
const red = { red: true };

export const PRINTER_MODELS: IPrinterModel[] = [
  m('Generic', '80 mm (576 dots)', G.t80),
  m('Generic', '80 mm (512 dots)', G.t80n),
  m('Generic', '72 mm', G.t72),
  m('Generic', '58 mm', G.t58),
  m('Generic', '76 mm impact (red/black ribbon)', G.i76, red),

  m('Epson', 'TM-T20', G.t80),
  m('Epson', 'TM-T20II', G.t80),
  m('Epson', 'TM-T20III', G.t80),
  m('Epson', 'TM-T20IV', G.t80),
  m('Epson', 'TM-T20X', G.t80),
  m('Epson', 'TM-T70', G.t80n),
  m('Epson', 'TM-T70II', G.t80),
  m('Epson', 'TM-T81III', G.t80),
  m('Epson', 'TM-T82', G.t80),
  m('Epson', 'TM-T82II', G.t80),
  m('Epson', 'TM-T82III', G.t80),
  m('Epson', 'TM-T82IIIL', G.t80),
  m('Epson', 'TM-T82X', G.t80),
  m('Epson', 'TM-T83III', G.t80),
  m('Epson', 'TM-T88II', G.t80n),
  m('Epson', 'TM-T88III', G.t80n),
  m('Epson', 'TM-T88IV', G.t80n, red),
  m('Epson', 'TM-T88IV South Asia', G.t80n, red),
  m('Epson', 'TM-T88V', G.t80n, red),
  m('Epson', 'TM-T88VI', G.t80n, red),
  m('Epson', 'TM-T88VII', G.t80n, red),
  m('Epson', 'TM-T90', G.t80n),
  m('Epson', 'TM-T100', G.t80),
  m('Epson', 'TM-m10', G.t58),
  m('Epson', 'TM-m30', G.t80),
  m('Epson', 'TM-m30II', G.t80),
  m('Epson', 'TM-m30III', G.t80),
  m('Epson', 'TM-m50', G.t80),
  m('Epson', 'TM-m50II', G.t80),
  m('Epson', 'TM-H6000IV', G.t80n),
  m('Epson', 'TM-H6000V', G.t80n),
  m('Epson', 'TM-L90', G.t80),
  m('Epson', 'TM-P20', G.t58),
  m('Epson', 'TM-P20II', G.t58),
  m('Epson', 'TM-P60II', G.t58),
  m('Epson', 'TM-P80', G.t80n),
  m('Epson', 'TM-P80II', G.t80n),
  m('Epson', 'TM-U220A', G.i76, red),
  m('Epson', 'TM-U220B', G.i76, red),
  m('Epson', 'TM-U220D', G.i76, red),
  m('Epson', 'TM-U220II', G.i76, red),
  m('Epson', 'TM-U230', G.i76, red),

  m('Star', 'TSP100 (TSP143)', G.t80, star),
  m('Star', 'TSP100II (TSP143II)', G.t80, star),
  m('Star', 'TSP100III (TSP143III)', G.t80, star),
  m('Star', 'TSP100IV (TSP143IV)', G.t80, star),
  m('Star', 'TSP600 (TSP613/TSP643)', G.t80n, star),
  m('Star', 'TSP650 (TSP654)', G.t80, star),
  m('Star', 'TSP650II (TSP654II)', G.t80, star),
  m('Star', 'TSP700II (TSP743II)', G.t80, star),
  m('Star', 'TUP500 (TUP542/TUP592)', G.t80n, star),
  m('Star', 'mC-Print2', G.t58, star),
  m('Star', 'mC-Print3', G.t80, star),
  m('Star', 'mPOP', G.t58, star),
  m('Star', 'SM-L200', G.t58, star),
  m('Star', 'SM-L300', G.t80, star),
  m('Star', 'SM-S230i', G.t58, star),
  m('Star', 'SM-T300i', G.t80, star),
  m('Star', 'SP2000', G.s76, { star: true, red: true }),
  m('Star', 'SP500 (SP512/SP542)', G.s76, { star: true, red: true }),
  m('Star', 'SP700 (SP712/SP742)', G.s76, { star: true, red: true }),
  m('Star', 'BSC10', G.t80),

  m('Citizen', 'CT-S251', G.t58),
  m('Citizen', 'CT-S310II', G.t80),
  m('Citizen', 'CT-S310III', G.t80),
  m('Citizen', 'CT-S601', G.t80, red),
  m('Citizen', 'CT-S601II', G.t80, red),
  m('Citizen', 'CT-S651', G.t80, red),
  m('Citizen', 'CT-S651II', G.t80, red),
  m('Citizen', 'CT-S751', G.t80, red),
  m('Citizen', 'CT-S801', G.t80, red),
  m('Citizen', 'CT-S801II', G.t80, red),
  m('Citizen', 'CT-S851II', G.t80, red),
  m('Citizen', 'CT-E301', G.t80),
  m('Citizen', 'CT-E351', G.t80),
  m('Citizen', 'CT-E601', G.t80),
  m('Citizen', 'CT-E651', G.t80),
  m('Citizen', 'CT-D150', G.t80),
  m('Citizen', 'CMP-20II', G.t58),
  m('Citizen', 'CMP-30II', G.t80),
  m('Citizen', 'iDP-3550', G.i76, red),

  m('Bixolon', 'SRP-275III (impact)', G.i76, red),
  m('Bixolon', 'SRP-330II', G.t80),
  m('Bixolon', 'SRP-330III', G.t80),
  m('Bixolon', 'SRP-350III', G.t80),
  m('Bixolon', 'SRP-350plusIII', G.t80),
  m('Bixolon', 'SRP-350V', G.t80),
  m('Bixolon', 'SRP-352III', G.t80),
  m('Bixolon', 'SRP-352plusIII', G.t80),
  m('Bixolon', 'SRP-380', G.t80),
  m('Bixolon', 'SRP-382', G.t80),
  m('Bixolon', 'SRP-E300', G.t80),
  m('Bixolon', 'SRP-E302', G.t80),
  m('Bixolon', 'SRP-Q300', G.t80),
  m('Bixolon', 'SRP-Q302', G.t80),
  m('Bixolon', 'SRP-S300', G.t80),
  m('Bixolon', 'SRP-F310II', G.t80),
  m('Bixolon', 'SRP-F312II', G.t80),
  m('Bixolon', 'SPP-R200III', G.t58),
  m('Bixolon', 'SPP-R310', G.t80),

  m('Xprinter', 'XP-58IIH', G.t58),
  m('Xprinter', 'XP-58IIL', G.t58),
  m('Xprinter', 'XP-P200', G.t58),
  m('Xprinter', 'XP-80C', G.t80),
  m('Xprinter', 'XP-C260H', G.t80),
  m('Xprinter', 'XP-N160I', G.t80),
  m('Xprinter', 'XP-N160II', G.t80),
  m('Xprinter', 'XP-P300', G.t80),
  m('Xprinter', 'XP-Q200', G.t80),
  m('Xprinter', 'XP-Q260', G.t80),
  m('Xprinter', 'XP-Q800', G.t80),
  m('Xprinter', 'XP-T80Q', G.t80),

  m('Rongta', 'RP58', G.t58),
  m('Rongta', 'RP80', G.t80),
  m('Rongta', 'RP80USE', G.t80),
  m('Rongta', 'RP326', G.t80),
  m('Rongta', 'RP332', G.t80),
  m('Rongta', 'RP850', G.t80),
  m('Rongta', 'ACE H1', G.t80),

  m('HPRT', 'PPT2-A', G.t58),
  m('HPRT', 'TP805', G.t80),
  m('HPRT', 'TP806', G.t80),
  m('HPRT', 'TP806L', G.t80),
  m('HPRT', 'TP808', G.t80),
  m('HPRT', 'TP80K', G.t80),

  m('Sunmi', 'V2 (built-in)', G.t58),
  m('Sunmi', 'V2 Pro (built-in)', G.t58),
  m('Sunmi', 'T2 (built-in)', G.t80),
  m('Sunmi', 'T2s (built-in)', G.t80),
  m('Sunmi', 'NT311 Cloud Printer', G.t80),
  m('Sunmi', 'NT212 Cloud Printer', G.t58),

  m('Zjiang', 'ZJ-5870', G.t58),
  m('Zjiang', 'ZJ-5890K', G.t58),
  m('Zjiang', 'POS-5890', G.t58),
  m('Zjiang', 'ZJ-8330', G.t80),
  m('Zjiang', 'ZJ-8360', G.t80),
  m('Netum', 'NT-5890K', G.t58),
  m('Netum', 'NT-1809', G.t58),
  m('Netum', 'NT-8330', G.t80),

  m('SNBC', 'BTP-R580II', G.t58),
  m('SNBC', 'BTP-R880NP', G.t80),
  m('SNBC', 'BTP-R880NPV', G.t80),
  m('SNBC', 'BTP-S80', G.t80),

  m('Sewoo', 'LK-P21', G.t58),
  m('Sewoo', 'SLK-TE200', G.t80),
  m('Sewoo', 'SLK-TS400', G.t80),
  m('Sewoo', 'SLK-T208', G.t80),

  m('Posiflex', 'PP-6900', G.t80),
  m('Posiflex', 'PP-8000', G.t80),
  m('Posiflex', 'PP-8800', G.t80),
  m('Posiflex', 'PP-9000', G.t80),
  m('Posiflex', 'Aura-7000', G.t80),
  m('Posiflex', 'Aura-8000', G.t80),

  m('Custom', 'KUBE II', G.t80),
  m('Custom', 'Q3X', G.t80),
  m('Custom', 'VKP80III', G.t80),
  m('Custom', 'TG2480-H', G.t80),

  m('Seiko', 'RP-D10', G.t80),
  m('Seiko', 'RP-E10', G.t80),
  m('Seiko', 'RP-F10', G.t80),
  m('Seiko', 'MP-B20', G.t58),

  m('Sam4s', 'Ellix 30', G.t80),
  m('Sam4s', 'Ellix 40', G.t80),
  m('Sam4s', 'Ellix 50', G.t80),
  m('Sam4s', 'Giant-100', G.t80),

  m('Toshiba', 'TRST-A10', G.t80),
  m('Toshiba', 'TRST-A15', G.t80),
  m('NCR', '7197', G.t80),
  m('NCR', '7198', G.t80),
  m('NCR', '7199', G.t80),
  m('HP', 'Engage One Prime Receipt Printer', G.t80),
  m('HP', 'Value Receipt Printer (A799)', G.t80),

  m('Partner Tech', 'RP-600', G.t80),
  m('Partner Tech', 'RP-630', G.t80),
  m('Metapace', 'T-1', G.t80),
  m('Metapace', 'T-3', G.t80),
  m('Munbyn', 'ITPP047', G.t80),
  m('Munbyn', 'ITPP068', G.t80),
  m('GOOJPRT', 'PT-200', G.t58),
  m('GOOJPRT', 'PT-210', G.t58),
  m('Hoin', 'HOP-H58', G.t58),
  m('Hoin', 'HOP-E801', G.t80),
  m('ZKTeco', 'ZKP5803', G.t58),
  m('ZKTeco', 'ZKP8001', G.t80),
  m('PBM', 'P822D', G.t80),
  m('EPOS', 'TEP-200M', G.t80),
];

export const findPrinterModel = (id?: string | null): IPrinterModel | undefined => PRINTER_MODELS.find(model => model.id === id);

const BRAND_ORDER = ['Epson', 'Star', 'Bixolon', 'SNBC', 'Xprinter', 'Citizen', 'Rongta', 'HPRT', 'Sunmi', 'Generic'];

export const PRINTER_BRANDS = [
  ...BRAND_ORDER.filter(brand => PRINTER_MODELS.some(model => model.brand === brand)),
  ...Array.from(new Set(PRINTER_MODELS.map(model => model.brand))).filter(brand => !BRAND_ORDER.includes(brand)).sort(),
];

const starLineOnly = (name: string) => /^(TSP100|mPOP|SM-)/.test(name);

export const methodsFor = (model?: IPrinterModel): PrinterCommandMode[] => {
  if (!model) return ['ESC_POS', 'WINDOWS_DRIVER'];
  const modes: PrinterCommandMode[] = [];
  if (!(model.star && starLineOnly(model.name))) modes.push('ESC_POS');
  if (model.star) modes.push('STAR_LINE');
  modes.push('WINDOWS_DRIVER');
  return modes;
};

const paperColumns = (size: IPrinterModel['size'], fontB: boolean) => {
  if (size === 'mm58') return fontB ? 42 : 35;
  if (size === 'mm72') return fontB ? 60 : 44;
  return fontB ? 64 : 48;
};

const cpiColumns = (size: IPrinterModel['size'], cpi: number) => {
  const printableMm = size === 'mm58' ? 48 : size === 'mm72' ? 64 : 72;
  return Math.floor((printableMm / 25.4) * cpi);
};

export interface IPrinterFontOption {
  id: PrinterFont;
  label: string;
  columns: number;
}

export const fontsFor = (model: IPrinterModel | undefined, mode: PrinterCommandMode, size: IPrinterModel['size']): IPrinterFontOption[] => {
  if (mode === 'WINDOWS_DRIVER') {
    return [
      { id: 'COURIER_10', label: `Courier New 10 CPI (${cpiColumns(size, 10)} columns)`, columns: cpiColumns(size, 10) },
      { id: 'COURIER_12', label: `Courier New 12 CPI (${cpiColumns(size, 12)} columns)`, columns: cpiColumns(size, 12) },
      { id: 'COURIER_17', label: `Courier New 17 CPI (${cpiColumns(size, 17)} columns)`, columns: cpiColumns(size, 17) },
    ];
  }
  const fontA = model?.fontAColumns ?? paperColumns(size, false);
  const fontB = model?.fontBColumns ?? paperColumns(size, true);
  return [
    { id: 'A', label: `Font A (${fontA} columns)`, columns: fontA },
    { id: 'B', label: `Font B (${fontB} columns)`, columns: fontB },
  ];
};

/** Largest width multiplier that still leaves at least 8 columns on Font A. */
export const maxWidthMultiplier = (columns?: number | null): number => {
  const cols = columns && columns > 0 ? columns : 48;
  let max = 1;
  for (let size = 1; size <= 8; size++) {
    if (Math.floor(cols / size) >= 8) max = size;
  }
  return max;
};
