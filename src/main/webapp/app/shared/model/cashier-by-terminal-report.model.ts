export interface ICashierByTerminalSection<T> {
  rows: T[];
  totalAmount?: number | null;
  totalQuantity?: number | null;
}

export interface ICashierByTerminalTypeRow {
  type?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface ICashierByTerminalFieldRow {
  field?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface ICashierByTerminalDiscountTypeRow {
  discountType?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface ICashierByTerminalTerminal {
  registryId?: string;
  registryName?: string;
  houseCharge?: ICashierByTerminalSection<ICashierByTerminalTypeRow>;
  tendersInDrawer?: ICashierByTerminalSection<ICashierByTerminalTypeRow>;
  cashierNegative?: ICashierByTerminalSection<ICashierByTerminalFieldRow>;
  lineItemDiscount?: ICashierByTerminalSection<ICashierByTerminalDiscountTypeRow>;
  subtotalDiscount?: ICashierByTerminalSection<ICashierByTerminalDiscountTypeRow>;
  paidOut?: ICashierByTerminalSection<ICashierByTerminalTypeRow>;
  paidIn?: ICashierByTerminalSection<ICashierByTerminalTypeRow>;
  giftCard?: ICashierByTerminalSection<ICashierByTerminalTypeRow>;
}

export interface ICashierByTerminalReport {
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  branchName?: string;
  terminals: ICashierByTerminalTerminal[];
}
