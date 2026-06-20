import React, { forwardRef } from 'react';
import { LabelTemplate } from '../model/label-template.model';
import { LabelDatum } from '../util/label-data';
import { LabelCanvas } from '../components/LabelCanvas';

export type FlatLabel = { datum: LabelDatum; copyNum: number; totalCopies: number };

type PrintSheetProps = {
  template: LabelTemplate;
  labels: FlatLabel[];
  useFormattedVariantName?: boolean;
  registerNode?: (index: number, node: HTMLDivElement | null) => void;
};

export const PrintSheet = forwardRef<HTMLDivElement, PrintSheetProps>(
  ({ template, labels, useFormattedVariantName = true, registerNode }, ref) => {
    const { widthMm, heightMm } = template;
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
        ))}
      </div>
    );
  }
);

PrintSheet.displayName = 'PrintSheet';
