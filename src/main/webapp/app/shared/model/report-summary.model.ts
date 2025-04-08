export interface ISummaryReport {
  totalSales: ISalesSummary;
  totalReceived: IReceivedSummary[];
  totalSalesByOrderOption: {
    [orderOption: string]: ISalesSummary;
  };
  tipSummary: ITipSummary[]
  catalogSection: ICatalogSection;
}

export interface ICatalogSection {
  catalogRecords: ISalesSummary[];
}

export interface ICatalogRecord {
  name: string;
  quantity: number;
}

export interface ITipSummary {
  username: string,
  totalTips: number,
  orderCount: number
}

export interface ISalesSummary {
  name?: string;
  orders: number;
  subTotal: number;
  discount: number;
  appliedCoupon: number;
  deliveryCharge: number;
  deliveryTAX: number;
  refunds: number;
  netSales: number;
  totalTAX: number;
  grossSales: number;
  totalTip: number;
  walletCredits?: number;
  taxes: {
    [taxType: string]: number;
  };
}


export interface IReceivedSummary {
  paymentType: string;
  tip: number;
  amount: number;
  refund: number;
  received: number;
}
