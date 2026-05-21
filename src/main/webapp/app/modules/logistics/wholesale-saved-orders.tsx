import React from 'react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Order } from 'app/entities/order/order';

const WholesaleSavedOrders = () => {
  return (
    <PageWrapper className="space-y-6">
      <Order pageType="saved" wholesale={true} />
    </PageWrapper>
  );
};

export default WholesaleSavedOrders;
