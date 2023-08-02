import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import SalesSection from "app/modules/analytics/reports/SalesSections";

const SalesSummaryReport = () => {

  const totalSalesData = [
    { label: 'Orders', value: '$0.00' },
    { label: 'SUBTOTAL', value: '$0.00' },
    { label: 'DISCOUNT', value: '$0.00' },
    { label: 'APPLIED COUPON', value: '$35,200.14' },
    { label: 'HST', value: '$4,579.38' },
    { label: 'GST', value: '$39,779.52' },
    { label: 'DELIVERY CHARGE', value: '$0.00' },
    { label: 'DELIVERY TAX', value: '$0.00' },
    { label: 'REFUNDS', value: '$0.00' },
    { label: 'APPLIED COUPON', value: '$35,200.14' },
  ];


  const totalReceived = [
    { payment: 'Debit', type: 'Card', tip: '$0.00', amount: '$10,000.00', refund: '$0.00', received: '$10,000.00' },
    { payment: 'Visa', type: 'Card', tip: '$100.00', amount: '$5,000.00', refund: '$0.00', received: '$5,100.00' },
    { payment: 'Master', type: 'Card', tip: '$50.00', amount: '$3,000.00', refund: '$0.00', received: '$3,050.00' },
    { payment: 'Cash', type: '', tip: '$0.00', amount: '$2,000.00', refund: '$0.00', received: '$2,000.00' },
    { payment: 'Debit', type: 'Card', tip: '$0.00', amount: '$10,000.00', refund: '$0.00', received: '$10,000.00' },
    { payment: 'Visa', type: 'Card', tip: '$100.00', amount: '$5,000.00', refund: '$0.00', received: '$5,100.00' },
    { payment: 'Master', type: 'Card', tip: '$50.00', amount: '$3,000.00', refund: '$0.00', received: '$3,050.00' },
    { payment: 'Cash', type: 'Card', tip: '$0.00', amount: '$2,000.00', refund: '$0.00', received: '$2,000.00' },
    { payment: 'Debit', type: 'Card', tip: '$0.00', amount: '$10,000.00', refund: '$0.00', received: '$10,000.00' },
  ];


  const newTotalSalesData = [
    { label: 'Orders', value: '$120.00' },
    { label: 'SUBTOTAL', value: '$180.00' },
    { label: 'DISCOUNT', value: '$20.00' },
    { label: 'APPLIED COUPON', value: '$10.20' },
    { label: 'HST', value: '$8.00' },
    { label: 'GST', value: '$12.00' },
    { label: 'DELIVERY CHARGE', value: '$2.50' },
    { label: 'DELIVERY TAX', value: '$1.50' },
    { label: 'REFUNDS', value: '$15.00' },
    { label: 'APPLIED COUPON', value: '$9.50' }
  ];

  const dineInData = [
    { label: 'Orders', value: '$300.00' },
    { label: 'SUBTOTAL', value: '$450.00' },
    { label: 'DISCOUNT', value: '$100.00' },
    { label: 'APPLIED COUPON', value: '$75.50' },
    { label: 'HST', value: '$25.00' },
    { label: 'GST', value: '$35.00' },
    { label: 'DELIVERY CHARGE', value: '$10.00' },
    { label: 'DELIVERY TAX', value: '$5.00' },
    { label: 'REFUNDS', value: '$50.00' },
    { label: 'APPLIED COUPON', value: '$60.00' }
  ];

  const togoData = [
    { label: 'Orders', value: '$100.00' },
    { label: 'SUBTOTAL', value: '$200.00' },
    { label: 'DISCOUNT', value: '$50.00' },
    { label: 'APPLIED COUPON', value: '$35.20' },
    { label: 'HST', value: '$10.00' },
    { label: 'GST', value: '$15.00' },
    { label: 'DELIVERY CHARGE', value: '$5.00' },
    { label: 'DELIVERY TAX', value: '$2.50' },
    { label: 'REFUNDS', value: '$20.00' },
    { label: 'APPLIED COUPON', value: '$15.00' }
  ];

  const deliveryData = [
    { label: 'Orders', value: '$50.00' },
    { label: 'SUBTOTAL', value: '$150.00' },
    { label: 'DISCOUNT', value: '$25.00' },
    { label: 'APPLIED COUPON', value: '$10.50' },
    { label: 'HST', value: '$5.00' },
    { label: 'GST', value: '$10.00' },
    { label: 'DELIVERY CHARGE', value: '$2.00' },
    { label: 'DELIVERY TAX', value: '$1.00' },
    { label: 'REFUNDS', value: '$5.00' },
    { label: 'APPLIED COUPON', value: '$7.50' }
  ];

  const calculateTotal = (data) => {
    let total = 0;
    data.forEach((item) => {
      const value = parseFloat(item.value.replace('$', '').replace(',', ''));
      total += value;
    });
    return total.toFixed(2);
  };

  const formatTotalWithCommas = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };


  return (
    <div className="container mt-5">
      <div className="text-center">
        <h2>Pos Business 10</h2>
        <h4>Sales Summary Report</h4>
        <p>Location: Random Location</p>
      </div>
      <SalesSection title="Total Sales" data={totalSalesData} isTotalSales={true} />

      <div className="row">

        <div className="container mt-5">
          <div className="col-md-12">
            <h3>Total Received</h3>
            <table className="table table-bordered table-lg">
              <thead>
              <tr className="bg-light">
                <th>PAYMENT</th>
                <th>TYPE</th>
                <th>TIP</th>
                <th>AMOUNT</th>
                <th>REFUND</th>
                <th>RECEIVED</th>
              </tr>
              </thead>
              <tbody>
              {totalReceived.map((item, index) => (
                <tr key={index}>
                  <td>{item.payment}</td>
                  <td>{item.type}</td>
                  <td className="text-end p-4">{item.tip}</td>
                  <td className="text-end p-4">{item.amount}</td>
                  <td className="text-end p-4">{item.refund}</td>
                  <td className="text-end">{item.received}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* <div className="col-md-12"> */}
        {/*   <div className="p-3 border rounded"> */}
        {/*     <h3 className="mb-4">Total Sales</h3> */}
        {/*     {totalSalesData.map((item, index) => ( */}
        {/*       <div className="d-flex justify-content-between mb-4" key={index}> */}
        {/*         <p>{item.label}</p> */}
        {/*         <p className="text-end">{item.value}</p> */}
        {/*       </div> */}
        {/*     ))} */}
        {/*   </div> */}
        {/* </div> */}
        {/* <div className="row"> */}
        {/*   <div className="col-md-12"> */}
        {/*     <div className="p-3 border rounded bg-light"> */}
        {/*       <h3 className="mb-4">New Total Sales <span className="text-sm" style={{ fontSize: '1rem' }}> */}
        {/*         | Total */}
        {/*       </span></h3> */}

        {/*       {newTotalSalesData.map((item, index) => ( */}
        {/*         <div className="d-flex justify-content-between mb-4" key={index}> */}
        {/*           <p>{item.label}</p> */}
        {/*           <p className="text-end">{item.value}</p> */}
        {/*         </div> */}
        {/*       ))} */}
        {/*       <hr /> */}
        {/*       <div className="d-flex justify-content-between" > */}

        {/*         <p>Total</p> */}
        {/*         <p className="text-end">{`$ ${formatTotalWithCommas(calculateTotal(newTotalSalesData))}`}</p> */}

        {/*       </div> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}
        <SalesSection title="DineIn" data={dineInData} />
        <SalesSection title="PickUp" data={togoData} />
        <SalesSection title="Delivery" data={deliveryData} />

      </div>
    </div>
  );
};

export default SalesSummaryReport;
