import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity as getOrder } from 'app/entities/order/order.reducer';
import { Order } from 'app/entities/order/order';
import { Translate } from 'react-jhipster';

interface OrdersTabProps {
  branchId: string | null;
  fromDate: string;
  toDate: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ branchId, fromDate, toDate }) => {
  const dispatch = useAppDispatch();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleRowClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    dispatch(getOrder(orderId));
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.selectBranchFirst">Please select a branch first</Translate>
        </p>
      </div>
    );
  }

  if (!fromDate || !toDate) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          <Translate contentKey="endOfDay.selectDateFirst">Please select an end date first</Translate>
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full min-w-0 overflow-hidden">
      {/* Orders Table - Using the same component as order.tsx */}
      <div className={selectedOrderId ? 'w-1/2 min-w-0 overflow-hidden' : 'w-full min-w-0 overflow-hidden'}>
        <Order
          pageType="history"
          externalFromDate={fromDate}
          externalToDate={toDate}
          externalBranchId={branchId}
          isEndOfDayMode={true}
        />
      </div>

      {/* Bills Placeholder */}
      {selectedOrderId && (
        <div className="w-1/2 border-l pl-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">Bills here</p>
          </div>
        </div>
      )}
    </div>
  );
};
