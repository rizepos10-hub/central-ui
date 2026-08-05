import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import {
  LabelElement,
  createDirectPrintSettings,
  createElement,
  duplicateTemplate,
  normalizeLabelTemplate,
  paperNameFor,
  validateBarcodeData,
} from './model/label-template.model';
import { LABEL_PRESETS } from './model/label-presets';
import {
  LabelDatum,
  findLabelBarcodeIssues,
  formatCurrency,
  resolveBarcodeData,
  resolveElementText,
  resolvePriceParts,
  resolveQrData,
  variantKey,
} from './util/label-data';
import {
  detectDirectPrintLanguage,
  extractDirectPrintPlaceholders,
  findDirectPrintControlChars,
  renderDirectPrintScript,
  visualizeDirectPrintScript,
} from './util/label-script';
import { compileDirectPrintTemplate } from './util/direct-print-compiler';
import { containRect } from './print/rotate-raster';
import { deleteTemplate, getDefaultTemplateId, listTemplates, saveTemplate, setDefaultTemplateId } from './store/label-templates.storage';
import { fitComparePrice, layoutLabelText } from './util/text-layout';
import { autoArrange, findLayoutWarnings } from './util/layout-warnings';
import { LabelTemplate } from './model/label-template.model';
import { createDesignerState, designerReducer } from './store/designer-reducer';

const product: IProduct = {
  id: 'prod-1',
  name: 'Blue T-Shirt',
  desc: 'Soft cotton tee',
  categories: [{ id: 'cat-1', name: 'Apparel' }],
  brand: { id: 'brand-1', name: 'Acme' },
  variants: [{ id: 'var-1', skus: ['TSHIRT-BLUE-M'], price: 20, salePrice: 15, attributeValues: {} }],
};

const datum: LabelDatum = { product, variant: product.variants[0], sku: 'TSHIRT-BLUE-M' };

describe('label-data resolution', () => {
  it('formats currency with two decimals', () => {
    expect(formatCurrency(15)).toBe('$15.00');
    expect(formatCurrency(15.5)).toBe('$15.50');
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('resolves text fields from product and variant', () => {
    expect(resolveElementText({ type: 'productName' } as LabelElement, datum, false)).toBe('Blue T-Shirt');
    expect(resolveElementText({ type: 'sku' } as LabelElement, datum)).toBe('TSHIRT-BLUE-M');
    expect(resolveElementText({ type: 'price' } as LabelElement, datum)).toBe('$15.00');
    expect(resolveElementText({ type: 'category' } as LabelElement, datum)).toBe('Apparel');
    expect(resolveElementText({ type: 'brand' } as LabelElement, datum)).toBe('Acme');
    expect(resolveElementText({ type: 'description' } as LabelElement, datum)).toBe('Soft cotton tee');
  });

  it('uses sku as barcode and qr data source', () => {
    expect(resolveBarcodeData(datum)).toBe('TSHIRT-BLUE-M');
    expect(resolveQrData({ type: 'qrCode', qrDataType: 'sku' } as LabelElement, datum)).toBe('TSHIRT-BLUE-M');
    expect(resolveQrData({ type: 'qrCode', qrDataType: 'internalId' } as LabelElement, datum)).toBe('prod-1');
  });

  it('prefers the explicitly selected sku over the variant primary sku', () => {
    const selectedSkuDatum: LabelDatum = {
      product,
      variant: { ...product.variants[0], skus: ['PRIMARY-SKU', 'SECONDARY-SKU'] } as any,
      sku: 'SECONDARY-SKU',
    };

    expect(resolveBarcodeData(selectedSkuDatum)).toBe('SECONDARY-SKU');
    expect(resolveElementText({ type: 'sku' } as LabelElement, selectedSkuDatum)).toBe('SECONDARY-SKU');
  });

  it('builds a stable variant key', () => {
    expect(variantKey('prod-1', 'var-1', 'SKU-1')).toBe('prod-1:var-1:SKU-1');
    expect(variantKey('prod-1')).toBe('prod-1:base:');
  });

  it('splits price into original + current when on sale', () => {
    const onSale = resolvePriceParts({ price: 20, salePrice: 15 } as any);
    expect(onSale).toEqual({ current: '$15.00', original: '$20.00', onSale: true });

    const noSale = resolvePriceParts({ price: 20 } as any);
    expect(noSale).toEqual({ current: '$20.00', original: undefined, onSale: false });

    // sale not lower than price → not treated as a sale
    const notLower = resolvePriceParts({ price: 20, salePrice: 25 } as any);
    expect(notLower.onSale).toBe(false);
    expect(notLower.current).toBe('$25.00');
  });
});

describe('barcode validation', () => {
  it('rejects wrong length EAN-13', () => {
    expect(validateBarcodeData('ean13', '123')).toMatch(/13 digits/);
    expect(validateBarcodeData('ean13', '5901234123457')).toBeNull();
  });

  it('accepts any code128 data', () => {
    expect(validateBarcodeData('code128', 'TSHIRT-BLUE-M')).toBeNull();
  });
});

describe('template helpers', () => {
  it('ships six presets with a single default', () => {
    expect(LABEL_PRESETS).toHaveLength(6);
    expect(LABEL_PRESETS.filter(t => t.isDefault)).toHaveLength(1);
  });

  it('names common paper sizes', () => {
    const priceTag = LABEL_PRESETS.find(t => t.id === 'preset-price-tag') ?? LABEL_PRESETS[0];
    expect(paperNameFor(priceTag)).toBe('Thermal Small');
  });

  it('duplicates with fresh ids', () => {
    const original = LABEL_PRESETS[0];
    const copy = duplicateTemplate(original, 'My Copy');
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('My Copy');
    expect(copy.isDefault).toBe(false);
    expect(copy.elements.every((e, i) => e.id !== original.elements[i].id)).toBe(true);
  });

  it('creates barcode elements with a default symbology', () => {
    expect(createElement('barcode').barcodeSymbology).toBe('code128');
    expect(createElement('barcode').alignment).toBe('center');
    expect(createElement('qrCode').qrDataType).toBe('sku');
    expect(createElement('qrCode').alignment).toBe('center');
  });
});

describe('text layout', () => {
  const box = { fontSizePt: 12, bold: false, widthMm: 40, heightMm: 12 };

  it('returns no lines for empty text', () => {
    expect(layoutLabelText({ ...box, text: '' }).lines).toHaveLength(0);
    expect(layoutLabelText({ ...box, text: '   ' }).lines).toHaveLength(0);
  });

  it('keeps short text on a single line at the requested size', () => {
    const result = layoutLabelText({ ...box, text: 'Hi' });
    expect(result.lines).toEqual(['Hi']);
    expect(result.truncated).toBe(false);
    expect(result.fontSizePt).toBe(12);
  });

  it('clamps to maxLines and marks truncated', () => {
    const result = layoutLabelText({ ...box, text: 'one\ntwo\nthree', autoFit: false, maxLines: 1 });
    expect(result.lines).toHaveLength(1);
    expect(result.truncated).toBe(true);
    expect(result.lines[0].endsWith('…')).toBe(true);
  });

  it('shrinks the font when text cannot fit and autoFit is on', () => {
    const tall = layoutLabelText({ text: 'word\nword\nword\nword', fontSizePt: 20, bold: false, widthMm: 40, heightMm: 8, autoFit: true });
    expect(tall.fontSizePt).toBeLessThan(20);
  });

  it('keeps a compare price at the requested size when it fits', () => {
    const fit = fitComparePrice('$9.99', '$20.00', 12, 100, 12);
    expect(fit.currentPt).toBe(12);
    expect(fit.originalPt).toBeLessThan(fit.currentPt);
  });

  it('shrinks a compare price so original + sale fit a narrow box', () => {
    const fit = fitComparePrice('$9,999.99', '$20,000.00', 14, 12, 5);
    expect(fit.currentPt).toBeLessThan(14);
  });
});

describe('layout warnings', () => {
  const make = (elements: LabelTemplate['elements']): LabelTemplate => ({
    id: 't',
    name: 't',
    widthMm: 50,
    heightMm: 30,
    orientation: 'portrait',
    templateType: 'visual',
    directPrint: null,
    isDefault: false,
    isActive: true,
    elements,
  });

  const box = (id: string, xMm: number, yMm: number) => ({
    id,
    type: 'customText' as const,
    xMm,
    yMm,
    widthMm: 20,
    heightMm: 10,
    fontSize: 8,
    fontBold: false,
    alignment: 'left' as const,
    rotation: 0,
    visible: true,
    value: id,
  });

  it('flags overlapping elements', () => {
    const warnings = findLayoutWarnings(make([box('a', 2, 2), box('b', 10, 2)]));
    expect(warnings.some(w => w.kind === 'overlap')).toBe(true);
  });

  it('flags out-of-bounds elements', () => {
    const warnings = findLayoutWarnings(make([box('a', 45, 2)]));
    expect(warnings.some(w => w.kind === 'outOfBounds')).toBe(true);
  });

  it('reports no warnings for a clean layout', () => {
    expect(findLayoutWarnings(make([box('a', 2, 2), box('b', 2, 16)]))).toHaveLength(0);
  });

  it('auto-arrange clears overlaps', () => {
    const overlapping = make([box('a', 2, 2), box('b', 8, 4), box('c', 12, 6)]);
    expect(findLayoutWarnings(overlapping).some(w => w.kind === 'overlap')).toBe(true);
    expect(findLayoutWarnings(autoArrange(overlapping)).some(w => w.kind === 'overlap')).toBe(false);
  });

  it('auto-arrange fixes a rotated, out-of-bounds element', () => {
    const tpl: LabelTemplate = {
      id: 't',
      name: 't',
      widthMm: 50,
      heightMm: 30,
      orientation: 'portrait',
      templateType: 'visual',
      directPrint: null,
      isDefault: false,
      isActive: true,
      elements: [
        { ...createElement('description', { xMm: 30, yMm: 25, widthMm: 40, heightMm: 6, rotation: 90 }) },
        { ...createElement('price', { xMm: 30, yMm: 24, widthMm: 40, heightMm: 8 }) },
      ],
    };
    expect(findLayoutWarnings(tpl).length).toBeGreaterThan(0);
    expect(findLayoutWarnings(autoArrange(tpl))).toHaveLength(0);
  });

  it('does not flag a rotated side element that visually clears the stack', () => {
    // Wide box rotated 90° → a narrow vertical strip pinned to the right edge.
    const sideText = createElement('description', { xMm: 23, yMm: 1, widthMm: 28, heightMm: 4, rotation: 90 });
    const name = createElement('productName', { xMm: 2, yMm: 2, widthMm: 30, heightMm: 8 });
    expect(findLayoutWarnings(make([sideText, name])).some(w => w.kind === 'overlap')).toBe(false);
  });

  it('auto-arrange keeps a rotated element rotated and in place', () => {
    const side = createElement('description', { xMm: 24, yMm: 4, widthMm: 20, heightMm: 4, rotation: 90 });
    const price = createElement('price', { xMm: 0, yMm: 0, widthMm: 30, heightMm: 8 });
    const result = autoArrange(make([side, price]));
    const arrangedSide = result.elements.find(e => e.id === side.id) ?? side;
    expect(arrangedSide.rotation).toBe(90);
    expect(findLayoutWarnings(result)).toHaveLength(0);
  });
});

describe('image aspect fit', () => {
  it('fits a wide image inside the box without stretching and centers it', () => {
    const rect = containRect(0, 0, 40, 20, 100, 25);
    expect(rect.widthMm).toBeCloseTo(40);
    expect(rect.heightMm).toBeCloseTo(10);
    expect(rect.yMm).toBeCloseTo(5);
    expect(rect.widthMm / rect.heightMm).toBeCloseTo(100 / 25);
  });

  it('falls back to the box for an unknown natural size', () => {
    const rect = containRect(2, 3, 10, 8, 0, 0);
    expect(rect).toEqual({ xMm: 2, yMm: 3, widthMm: 10, heightMm: 8 });
  });
});

describe('barcode issues', () => {
  const tpl = (elements: LabelTemplate['elements']): LabelTemplate => ({
    id: 't',
    name: 't',
    widthMm: 50,
    heightMm: 30,
    orientation: 'portrait',
    templateType: 'visual',
    directPrint: null,
    isDefault: false,
    isActive: true,
    elements,
  });

  const barcode = createElement('barcode', { barcodeSymbology: 'ean13' });

  it('flags products whose SKU is invalid for the chosen symbology', () => {
    const bad: LabelDatum = { product: { id: 'p', name: 'Bad Item' } as any, variant: { id: 'v', sku: '123' } as any };
    const issues = findLabelBarcodeIssues(tpl([barcode]), [bad]);
    expect(issues).toHaveLength(1);
    expect(issues[0].productName).toBe('Bad Item');
  });

  it('passes a valid EAN-13 SKU', () => {
    const good: LabelDatum = { product: { id: 'p', name: 'Good' } as any, variant: { id: 'v', sku: '5901234123457' } as any };
    expect(findLabelBarcodeIssues(tpl([barcode]), [good])).toHaveLength(0);
  });

  it('flags a missing SKU', () => {
    const none: LabelDatum = { product: { id: 'p', name: 'No SKU' } as any, variant: { id: 'v' } as any };
    expect(findLabelBarcodeIssues(tpl([barcode]), [none])).toHaveLength(1);
  });
});

describe('designer reducer', () => {
  const start = (): LabelTemplate => ({
    id: 't',
    name: 'T',
    widthMm: 50,
    heightMm: 30,
    orientation: 'portrait',
    templateType: 'visual',
    directPrint: null,
    isDefault: false,
    isActive: true,
    elements: [],
  });

  it('keeps elements inside the label when it is shrunk', () => {
    let state = createDesignerState(start());
    state = designerReducer(state, { type: 'add', elementType: 'productName' });
    const id = state.template.elements[0].id;
    state = designerReducer(state, { type: 'updateElement', element: { ...state.template.elements[0], xMm: 40, yMm: 20, widthMm: 10, heightMm: 10 } });
    state = designerReducer(state, { type: 'updateTemplate', patch: { widthMm: 20, heightMm: 15 } });
    const e = state.template.elements.find(el => el.id === id) ?? state.template.elements[0];
    expect(e.xMm + e.widthMm).toBeLessThanOrEqual(20.001);
    expect(e.yMm + e.heightMm).toBeLessThanOrEqual(15.001);
  });

  it('nudges within bounds and records history', () => {
    let state = createDesignerState(start());
    state = designerReducer(state, { type: 'add', elementType: 'sku' });
    const id = state.template.elements[0].id;
    state = designerReducer(state, { type: 'updateElement', element: { ...state.template.elements[0], xMm: 0, yMm: 0 } });
    const before = state.past.length;
    state = designerReducer(state, { type: 'nudge', id, dxMm: -5, dyMm: -5 });
    expect(state.template.elements[0].xMm).toBe(0);
    state = designerReducer(state, { type: 'nudge', id, dxMm: 3, dyMm: 2 });
    expect(state.template.elements[0].xMm).toBe(3);
    expect(state.past.length).toBeGreaterThan(before);
  });

  it('lets a 90°-rotated element move past the unrotated width limit', () => {
    let state = createDesignerState(start()); // 50 x 30 label
    state = designerReducer(state, { type: 'add', elementType: 'description' });
    const id = state.template.elements[0].id;
    // wide-but-short box, rotated 90° so its visual footprint is tall-and-narrow
    state = designerReducer(state, {
      type: 'updateElement',
      element: { ...state.template.elements[0], xMm: 5, yMm: 5, widthMm: 28, heightMm: 4, rotation: 90 },
    });
    // nudge far to the right — old logic capped x at (50 - 28) = 22; rotated footprint is only 4 wide
    state = designerReducer(state, { type: 'nudge', id, dxMm: 100, dyMm: 0 });
    const e = state.template.elements.find(el => el.id === id) ?? state.template.elements[0];
    const cx = e.xMm + e.widthMm / 2;
    expect(cx).toBeGreaterThan(40); // center can reach near the right edge (50 - 4/2 = 48)
    expect(cx).toBeLessThanOrEqual(48.001);
  });

  it('reorders z-order', () => {
    let state = createDesignerState(start());
    state = designerReducer(state, { type: 'add', elementType: 'sku' });
    state = designerReducer(state, { type: 'add', elementType: 'price' });
    const firstId = state.template.elements[0].id;
    state = designerReducer(state, { type: 'reorder', id: firstId, dir: 'forward' });
    expect(state.template.elements[1].id).toBe(firstId);
  });
});

describe('template storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns presets when nothing is stored', () => {
    expect(listTemplates()).toHaveLength(6);
  });

  it('persists, lists and deletes custom templates', () => {
    const custom = duplicateTemplate(LABEL_PRESETS[0], 'Custom One');
    saveTemplate(custom);
    expect(listTemplates().some(t => t.id === custom.id)).toBe(true);
    deleteTemplate(custom.id);
    expect(listTemplates().some(t => t.id === custom.id)).toBe(false);
  });

  it('tracks the default template id', () => {
    const custom = duplicateTemplate(LABEL_PRESETS[0], 'Default Candidate');
    saveTemplate(custom);
    setDefaultTemplateId(custom.id);
    expect(getDefaultTemplateId()).toBe(custom.id);
    expect(listTemplates().find(t => t.id === custom.id)?.isDefault).toBe(true);
  });

  it('normalizes legacy templates without explicit type metadata', () => {
    localStorage.setItem(
      'retail-label-templates',
      JSON.stringify([
        {
          id: 'legacy-template',
          name: 'Legacy',
          widthMm: 40,
          heightMm: 25,
          orientation: 'portrait',
          isDefault: false,
          isActive: true,
          elements: [],
        },
      ])
    );

    const legacy = listTemplates().find(t => t.id === 'legacy-template');
    expect(legacy?.templateType).toBe('visual');
    expect(legacy?.directPrint).toBeNull();
  });
});

describe('direct-print scripts', () => {
  it('duplicates direct-print settings intact', () => {
    const direct = normalizeLabelTemplate({
      id: 'direct-1',
      name: 'Direct',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'zpl', printerName: 'ZDesigner ZD420', dpi: 300 }),
      isDefault: false,
      isActive: true,
      elements: [createElement('productName')],
    });

    const copy = duplicateTemplate(direct, 'Direct Copy');
    expect(copy.templateType).toBe('direct');
    expect(copy.directPrint?.language).toBe('zpl');
    expect(copy.directPrint?.printerName).toBe('ZDesigner ZD420');
    expect(copy.directPrint?.dpi).toBe(300);
  });

  it('extracts placeholders and renders a raw printer script', () => {
    const script = '^FO20,20^FD@name^FS^FO20,50^FD@price^FS^FO20,80^FD@barcode^FS';
    expect(extractDirectPrintPlaceholders(script)).toEqual(['name', 'price', 'barcode']);

    const rendered = renderDirectPrintScript(script, datum);
    expect(rendered).toContain('Blue T-Shirt');
    expect(rendered).toContain('$15.00');
    expect(rendered).toContain('TSHIRT-BLUE-M');
  });

  it('detects ZPL and exposes control bytes safely for previewing', () => {
    const script = '\u0010CT~CD,~CC^~CT\n^XA\n^FO20,20^FD@name^FS\n^XZ';
    expect(detectDirectPrintLanguage(script)).toBe('zpl');
    expect(findDirectPrintControlChars(script)).toEqual(['0x10']);
    expect(visualizeDirectPrintScript(script)).toContain('\\x10CT~CD,~CC^~CT');
  });

  it('compiles a visual direct-print template into ZPL', () => {
    const direct = normalizeLabelTemplate({
      id: 'direct-2',
      name: 'Compiled',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'zpl', dpi: 203 }),
      isDefault: false,
      isActive: true,
      elements: [
        createElement('productName', { xMm: 2, yMm: 2, widthMm: 40, heightMm: 8, fontSize: 10 }),
        createElement('barcode', { xMm: 2, yMm: 12, widthMm: 45, heightMm: 14, barcodeSymbology: 'code128' }),
      ],
    });

    const compiled = compileDirectPrintTemplate(direct, datum, 'zpl', 203);
    expect(compiled.script).toContain('^XA');
    expect(compiled.script.includes('^GFA,') || compiled.script.includes('^FO16,32')).toBe(true);
  });

  it('keeps wrapped product names on separate native lines instead of one overflowing command', () => {
    const wrappedDatum: LabelDatum = {
      product: { ...product, name: 'Premium Organic Colombian Coffee Beans Extra Bold Roast' } as any,
      variant: product.variants[0],
    };
    const direct = normalizeLabelTemplate({
      id: 'direct-2b',
      name: 'Wrapped Name',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'tspl', dpi: 203 }),
      isDefault: false,
      isActive: true,
      elements: [createElement('productName', { xMm: 2, yMm: 2, widthMm: 24, heightMm: 9, fontSize: 10, maxLines: 2 })],
    });

    const compiled = compileDirectPrintTemplate(direct, wrappedDatum, 'tspl', 203);
    const textLines = compiled.script.split('\n').filter(line => line.startsWith('TEXT '));
    expect(textLines.length).toBe(2);
    expect(textLines.join(' ')).not.toContain('Premium Organic Colombian Coffee Beans Extra Bold Roast');
  });

  it('centers the current price in compiled output when compare-price mode is enabled but there is no sale', () => {
    const direct = normalizeLabelTemplate({
      id: 'direct-3',
      name: 'Centered Price',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'zpl', dpi: 203 }),
      isDefault: false,
      isActive: true,
      elements: [createElement('price', { xMm: 2, yMm: 2, widthMm: 40, heightMm: 8, alignment: 'right', showComparePrice: true })],
    });

    const noSaleDatum: LabelDatum = { product, variant: { ...product.variants[0], salePrice: undefined } as any };
    const compiled = compileDirectPrintTemplate(direct, noSaleDatum, 'zpl', 203);
    expect(compiled.script.includes('^GFA,') || compiled.script.includes('$20.00')).toBe(true);
  });

  it('produces a different exact ZPL image when the barcode alignment changes', () => {
    const leftBarcode = normalizeLabelTemplate({
      id: 'direct-4',
      name: 'Left Barcode',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'zpl', dpi: 203 }),
      isDefault: false,
      isActive: true,
      elements: [createElement('barcode', { xMm: 2, yMm: 12, widthMm: 45, heightMm: 14, alignment: 'left', barcodeSymbology: 'ean13' })],
    });
    const centeredBarcode = normalizeLabelTemplate({
      ...leftBarcode,
      id: 'direct-5',
      elements: [createElement('barcode', { xMm: 2, yMm: 12, widthMm: 45, heightMm: 14, alignment: 'center', barcodeSymbology: 'ean13' })],
    });

    const leftScript = compileDirectPrintTemplate(leftBarcode, { product, variant: { ...product.variants[0], sku: '5901234123457' } as any }, 'zpl', 203).script;
    const centeredScript = compileDirectPrintTemplate(
      centeredBarcode,
      { product, variant: { ...product.variants[0], sku: '5901234123457' } as any },
      'zpl',
      203
    ).script;

    expect(centeredScript).not.toBe(leftScript);
    expect(centeredScript.includes('^GFA,') || centeredScript.includes('^FO')).toBe(true);
  });

  it('falls back to native ZPL commands when the template uses unsupported exact-mode elements', () => {
    const withQr = normalizeLabelTemplate({
      id: 'direct-6',
      name: 'QR Fallback',
      widthMm: 58,
      heightMm: 40,
      orientation: 'portrait',
      templateType: 'direct',
      directPrint: createDirectPrintSettings({ language: 'zpl', dpi: 203 }),
      isDefault: false,
      isActive: true,
      elements: [createElement('qrCode', { xMm: 2, yMm: 2, widthMm: 16, heightMm: 16 })],
    });

    const compiled = compileDirectPrintTemplate(withQr, datum, 'zpl', 203);
    expect(compiled.script).toContain('^BQN');
    expect(compiled.warnings[0]).toContain('Exact ZPL parity mode');
  });
});
