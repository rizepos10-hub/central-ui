import React, { forwardRef } from 'react';
import { LabelTemplate } from '../model/label-template.model';
import { LabelDatum } from '../util/label-data';
import { LabelCanvas } from '../components/LabelCanvas';
import { PrinterOffset, ZERO_OFFSET } from './printer-calibration';

export type FlatLabel = { datum: LabelDatum; copyNum: number; totalCopies: number };

type PrintSheetProps = {
  template: LabelTemplate;
  labels: FlatLabel[];
  useFormattedVariantName?: boolean;
  offset?: PrinterOffset;
  registerNode?: (index: number, node: HTMLDivElement | null) => void;
};

export const PrintSheet = forwardRef<HTMLDivElement, PrintSheetProps>(
  ({ template, labels, useFormattedVariantName = true, offset = ZERO_OFFSET, registerNode }, ref) => {
    const { widthMm, heightMm } = template;
    // Same alignment nudge as the QZ/PDF path, applied to the HTML the system print dialog renders.
    const shift = offset.xMm !== 0 || offset.yMm !== 0 ? `translate(${offset.xMm}mm, ${offset.yMm}mm)` : undefined;
    return (
      <div ref={ref} className="labels-print-root">
        {labels.map((label, index) => (
          <div
            key={index}
            ref={node => registerNode?.(index, node)}
            className="labels-print-label"
            style={{
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              background: '#ffffff',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', height: '100%', transform: shift }}>
              <LabelCanvas
                template={template}
                datum={label.datum}
                zoom={1}
                showGrid={false}
                editMode={false}
                useFormattedVariantName={useFormattedVariantName}
                withShadow={false}
                withBorder={false}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PrintSheet.displayName = 'PrintSheet';
