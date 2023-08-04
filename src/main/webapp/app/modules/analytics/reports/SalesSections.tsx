import React from 'react';

const SalesSection = ({ title, data, isTotalSales = false }) => {
  const formatValueWithCommas = (value) => {
    return value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0;
  };
  console.log(data, 'dataInHere')

  if (!data || !data.totalSales) {
    return <div>No data available.</div>;
  }

  console.log(data)
  return (
    <div className="row mt-4">
      <div className="col-md-12">
        <div className={`p-3 border rounded ${isTotalSales ? "" : 'bg-light'}`}>
          <h3 className="mb-4">
            {title} <span className="text-sm" style={{ fontSize: '1rem' }}>{!isTotalSales ? "| Total Sales" : ""}</span>
          </h3>
          <div className="d-flex justify-content-between mb-4">
            <p>Orders</p>
            <p className="text-end">
              {data.orders?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Subtotal</p>
            <p className="text-end">
              {data.subTotal?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Discount</p>
            <p className="text-end">
              {data.discount?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Applied Coupon</p>
            <p className="text-end">
              {data.appliedCoupon ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Delivery Charge</p>
            <p className="text-end">
              {data.deliveryCharge?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Delivery TAX</p>
            <p className="text-end">
              {data.deliveryTAX?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Refunds</p>
            <p className="text-end">
              {data.refunds?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Gst</p>
            <p className="text-end">
              {data.gst?.toFixed(2) ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p>Hst</p>
            <p className="text-end">
              {data.hst?.toFixed(2) ?? 0}
            </p>
          </div>


          <hr />
          <div className="d-flex justify-content-between">
            <strong>NET SALES</strong>
            {data.netSales?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong>TOTAL TAX</strong>
            {data.totalTAX?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong>GROSS SALES</strong>
            {data.grossSales?.toFixed(2) ?? 0}
          </div>
          <div className="d-flex justify-content-between">
            <strong>TOTAL TIP</strong>
            {data.totalTip?.toFixed(2) ?? 0}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SalesSection;
