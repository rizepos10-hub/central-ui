import React from 'react';
import {
  AlignLeft,
  Barcode,
  DollarSign,
  Image as ImageIcon,
  LayoutGrid,
  LucideIcon,
  QrCode,
  Stamp,
  Store,
  Tag,
  Type,
  Hash,
} from 'lucide-react';
import { LabelElementType } from '../model/label-template.model';

type ElementIconProps = {
  type: LabelElementType;
  size?: number;
  className?: string;
};

const ICONS: Record<LabelElementType, LucideIcon> = {
  productName: Tag,
  price: DollarSign,
  barcode: Barcode,
  qrCode: QrCode,
  sku: Hash,
  category: LayoutGrid,
  brand: Store,
  description: AlignLeft,
  customText: Type,
  logo: Stamp,
  productImage: ImageIcon,
};

export const ElementIcon = ({ type, size = 14, className }: ElementIconProps) => {
  const Icon = ICONS[type];
  return <Icon size={size} className={className} />;
};
