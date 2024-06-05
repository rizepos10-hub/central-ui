import React from 'react';
import { Col, Container, Row, Table } from 'reactstrap';

const EndOfTillSales = ({  title }) => {
  // const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX, refunds, netSales, totalTAX, grossSales, totalTip, hst, gst } = data;



  return (
    <Col>
      <h3>{title}</h3>
      <div className="table-responsive">
        <table className="table " id="sales_summary">
          <tbody>
          <tr>
            <th colSpan={2}>New sales</th>
            <th></th>
            <th colSpan={2} className="text-right">$1,200.04</th>
          </tr>
          <tr>
            <td></td>
            <td colSpan={2}>New</td>
            <td colSpan={2} className="text-right">$1,200.00</td>
          </tr>
          <tr>
            <td></td>
            <td colSpan={2}>
              <span  className="text-primary" title="No Tax ($0.00) + Hst ($5.68)">
                Tax (2 taxes) <i className="bi bi-arrow-up"></i>
              </span>
            </td>
            <td colSpan={2} className="text-right">$5.00</td>
          </tr>
          <tr >
            <td></td>
            <td className="tax-label" colSpan={3}>No Tax</td>
            <td className="text-right">$0.00</td>
          </tr>
          <tr>
            <td></td>
            <td className="tax-label" colSpan={3}>Hst</td>
            <td className="text-right">$5.00</td>
          </tr>
          <tr>
            <th>Discounts</th>
            <th colSpan={2}></th>
            <th colSpan={2} className="text-right">
              <span>$69.81</span>
            </th>
          </tr>
          <tr>
            <th>Payments</th>
            <th colSpan={2}></th>
            <th colSpan={2} className="text-right">$1,200,04</th>
          </tr>
          <tr>
            <td></td>
            <td colSpan={2}>New&nbsp;</td>
            <td colSpan={2} className="text-right">$1,200,04</td>
          </tr>
          </tbody>
        </table>
      </div>

    </Col>
  )
}
export default EndOfTillSales;
