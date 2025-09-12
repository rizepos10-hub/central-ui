import React, { useState } from "react";
import { Col, Container, Row, Table } from 'reactstrap';
import { ISummaryReport } from "app/shared/model/report-summary.model";

const GenericSalesReport = ({ title, report }: { title: string; report: ISummaryReport["totalSales"] }) => {
  if (!report) return;

  const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX,
    refunds, netSales, totalTAX, grossSales, walletCredits, totalTip, taxes } = report;

  const [show, setShow] = useState(false);

  const handleClick = () => {
    setShow(prevState => !prevState);
  }

  return (
    <Col className="p-0">
      <h4>{title}</h4>
      <div className="table-responsive">
        <table className="table table-sm" id="sales_summary">
          <tbody>
            <tr>
              <th colSpan={2}>New sales (orders)</th>
              <th colSpan={2} className="col-4 text-right">
                {orders}
              </th>
            </tr>
            <tr>
              <th colSpan={2}>Gross Sales</th>
              <th colSpan={2} className="text-right">
                {(grossSales + refunds).toFixed(2)}
              </th>
              <th colSpan={2} className="text-right">
                Sales include refunds
              </th>
            </tr>
            <tr>
              <th colSpan={2}>Refunds</th>
              <th colSpan={2} className="text-right text-danger">
                {refunds || 0}
              </th>
            </tr>
            <tr>
              <th colSpan={2}>Gross Sales</th>
              <th colSpan={2} className="text-right">
                {grossSales}
              </th>
            </tr>
            <tr>
              <th colSpan={2}>
                <span
                  onClick={handleClick}
                  className="text-primary cursor-pointer"
                  title="No Tax ($0.00) + Hst ($5.68)"
                >
                  Tax ({Object.keys(taxes || {})?.length})
                  <i className="pi pi-angle-up"></i>
                </span>
              </th>
              <th colSpan={2} className="text-right text-danger">
                {totalTAX}
              </th>
            </tr>
            {Object?.entries(taxes || {})?.map(([taxType, amount]) => (
              <tr key={taxType} className={`${!show && 'hidden'}`}>
                <th colSpan={3}>{taxType}</th>
                <th className="text-right">{amount}</th>
              </tr>
            ))}
            <tr>
              <td colSpan={4}>&nbsp;</td>
            </tr>
            <tr>
              <th>Net Sales</th>
              <th colSpan={2} className="text-right">
                <span>${netSales}</span>
              </th>
            </tr>
            <tr>
              <th>Discounts</th>
              <th colSpan={2} className="text-right">
                <span>${discount}</span>
              </th>
            </tr>
            <tr>
              <th>Tip</th>
              <th colSpan={2} className="text-right">
                {totalTip}
              </th>
            </tr>
            <tr>
              <td colSpan={4}>&nbsp;</td>
            </tr>
            <tr>
              <th>Collected</th>
              <th colSpan={2} className="text-right">
                {subTotal}
              </th>
            </tr>
          </tbody>
        </table>

      </div>
    </Col>
  );
}
export default GenericSalesReport;
