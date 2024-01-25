import React from 'react';
import {Translate} from "react-jhipster";

const SalesSection = ({ title, data, isTotalSales = false }) => {
  const formatValueWithCommas = (value) => {
    return value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0;
  };
  console.log(data, 'dataInHere')

  // if (!data || !data.totalSales) {
  //   return <div>No data available.</div>;
  // }

  console.log(data)
  return (
    <div className="row mt-4">
      <div className="col-md-12">
        <div className={`p-3 border rounded ${isTotalSales ? "" : 'bg-light'}`}>
          <h3 className="mb-4">
            {title} <span className="text-sm" style={{ fontSize: '1rem' }}>{!isTotalSales ? "| Total Sales" : ""}</span>
          </h3>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.orders'}>Orders</Translate></p>
            <p className="text-end">
              {data?.orders?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.subtotal'}>Subtotal</Translate></p>
            <p className="text-end">
              {data?.subTotal?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.discount'}>Discount</Translate></p>
            <p className="text-end">
              {data?.discount?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.coupon'}>Applied Coupon</Translate></p>
            <p className="text-end">
              {data?.appliedCoupon ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.d-charge'}>Delivery Charge</Translate></p>
            <p className="text-end">
              {data?.deliveryCharge?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.d-tax'}>Delivery TAX</Translate></p>
            <p className="text-end">
              {data?.deliveryTAX?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.refunds'}>Refunds</Translate></p>
            <p className="text-end">
              {data?.refunds?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.gst'}>Gst</Translate></p>
            <p className="text-end">
              {data?.gst?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.endOfDay.report.hst'}>Hst</Translate></p>
            <p className="text-end">
              {data?.hst?.toFixed(2) ?? 0}
            </p>
          </div>


          <hr />
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.endOfDay.report.netSales'}>NET SALES</Translate></strong>
            {data?.netSales?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.endOfDay.report.totalTax'}>TOTAL TAX</Translate></strong>
            {data?.totalTAX?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.endOfDay.report.grossSales'}>GROSS SALES</Translate></strong>
            {data?.grossSales?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.endOfDay.report.totalTip'}>TOTAL TIP</Translate></strong>
            {data?.totalTip?.toFixed(2) ?? 0}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SalesSection;
