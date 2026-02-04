import React from 'react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
import { Order } from 'app/entities/order/order';
import { useAppSelector } from 'app/config/store';
// import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
// import { DeliverStatus } from 'app/shared/model/ENUMS/delivery-status.model';

const WholesaleOrders = () => {
  const orderList = useAppSelector(state => state.order.entities);
  const totalOrders = useAppSelector(state => state.order.totalOrders) || 0;

  // const inTransitOrders = orderList.filter(
  //   order => order.orderProcessingStatus === OrderStatus.IN_DELIVERY || order.deliveryStatus === DeliverStatus.IN_DELIVERY
  // ).length;
  // const pendingOrders = orderList.filter(
  //   order => order.orderProcessingStatus === OrderStatus.DRAFT || order.orderProcessingStatus === OrderStatus.CONFIRMED || order.orderProcessingStatus === OrderStatus.PROCESSING
  // ).length;

  return (
    <PageWrapper className="space-y-6">
      {/* <Card> */}
        {/* <CardContent> */}
          {/* <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total orders</p>
              <p className="text-2xl font-semibold text-slate-900">{totalOrders}</p>
            </div>
            <div className="rounded border border-slate-200 bg-emerald-50 p-4">
              <p className="text-sm text-slate-500">In transit</p>
              <p className="text-2xl font-semibold text-emerald-900">{inTransitOrders}</p>
            </div>
            <div className="rounded border border-slate-200 bg-amber-50 p-4">
              <p className="text-sm text-slate-500">Pending dispatch</p>
              <p className="text-2xl font-semibold text-amber-900">{pendingOrders}</p>
            </div>
          </div> */}
          <Order pageType="" wholesale={true} />
        {/* </CardContent> */}
      {/* </Card> */}
    </PageWrapper>
  );
};

export default WholesaleOrders;
