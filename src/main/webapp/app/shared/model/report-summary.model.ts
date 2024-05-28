export interface ISummaryReport {
  totalSales: {
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
    hst: number;
    gst: number;
  };
  totalReceived: {
    paymentType: string;
    tip: number;
    amount: number;
    refund: number;
    received: number;
  }[];
  totalSalesByOrderOption: {
    WalkIn: {
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
      hst: number;
      gst: number;
    };
    DineIn: {
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
      hst: number;
      gst: number;
    };
    PickUp: {
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
      hst: number;
      gst: number;
    };
    Delivery: {
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
      hst: number;
      gst: number;
    };
  };
}

