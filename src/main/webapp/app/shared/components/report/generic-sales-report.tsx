import React, { useState } from "react";
import { Col, Container, Row, Table } from 'reactstrap';
import { ISummaryReport } from "app/shared/model/report-summary.model";

const GenericSalesReport = ({  title, report }: {title: string; report: ISummaryReport["totalSales"] }) => {
  if(!report) return;

  const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX,
    refunds, netSales, totalTAX, grossSales, totalTip,taxes} = report;

  const [show, setShow] = useState(false);

  const handleClick = () => {
    setShow(prevState => !prevState);
  }

  return (
    <Col>
      <h3>{title}</h3>
      <div className="table-responsive">
        <table className="table " id="sales_summary">
          <tbody>
            <tr>
              <th colSpan={2}>New sales (orders)</th>
              <th></th>
              <th colSpan={2} className="col-4 text-right">
                {orders}
              </th>
            </tr>
            <tr>
              <td></td>
              <td colSpan={2}>Gross Sales</td>
              <td colSpan={2} className="text-right">
                {grossSales}
              </td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={2}>Net Sales</td>
              <td colSpan={2} className="text-right">
                {netSales}
              </td>
            </tr>
            <tr>
              <td></td>
              {
                <td colSpan={2}>
                  <span onClick={handleClick} className="text-primary cursor-pointer" title="No Tax ($0.00) + Hst ($5.68)">
                    Tax ({Object.keys(taxes || {})?.length})<i className="pi pi-angle-up "></i>
                  </span>
                </td>
              }
              <td colSpan={2} className="text-right">
                {totalTAX}
              </td>
            </tr>
            {Object?.entries(taxes || {})?.map(([taxType, amount]) => (
              <tr key={taxType} className={`${!show && 'hidden'}`}>
                <td></td>
                <td colSpan={3}>{taxType}</td>
                <td className="text-right">{amount}</td>
              </tr>
            ))}
            <tr>
              <th>Discounts</th>
              <th colSpan={2}></th>
              <th colSpan={2} className="text-right">
                <span>${discount}</span>
              </th>
            </tr>
            <tr>
              <th>Payments</th>
              <th colSpan={2}></th>
              <th colSpan={2} className="text-right">
                {subTotal}
              </th>
            </tr>
            <tr>
              <td></td>
              <td colSpan={2}>Subtotal</td>
              <td colSpan={2} className="text-right">
                {subTotal}
              </td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={2}>Refunds</td>
              <td colSpan={2} className="text-right">
                {refunds}
              </td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={2}>Applied Coupon</td>
              <td colSpan={2} className="text-right">
                {appliedCoupon}
              </td>
            </tr>
            <tr>
              <th>Tip</th>
              <th colSpan={2}></th>
              <th colSpan={2} className="text-right">
                {totalTip}
              </th>
            </tr>
          </tbody>
        </table>
      </div>
    </Col>
  );
}
export default GenericSalesReport;
