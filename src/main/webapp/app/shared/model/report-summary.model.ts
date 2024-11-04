export interface ISummaryReport {
  totalSales: ISalesSummary;
  totalReceived: IReceivedSummary[];
  totalSalesByOrderOption: {
    [orderOption: string]: ISalesSummary;
  };
}

export interface ISalesSummary {
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
  walletCredits? : number;
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
