import React from 'react';
import { ELEMENT_TYPE_COLORS, ELEMENT_TYPE_LABELS, LabelElementType } from '../model/label-template.model';
import { ElementIcon } from './ElementIcon';

type ElementChipProps = {
  type: LabelElementType;
};

export const ElementChip = ({ type }: ElementChipProps) => {
  const color = ELEMENT_TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      style={{ color, backgroundColor: `${color}1a`, borderColor: `${color}4d` }}
    >
      <ElementIcon type={type} size={10} />
      {ELEMENT_TYPE_LABELS[type]}
    </span>
  );
};
