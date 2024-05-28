import React from 'react';
import { Col, Container, Row, Table } from 'reactstrap';

const EndOfTillSales = ({ data, title }) => {
  const { orders, subTotal, discount, appliedCoupon, deliveryCharge, deliveryTAX, refunds, netSales, totalTAX, grossSales, totalTip, hst, gst } = data;



  return (
        <Col>
          <h3>{title}</h3>
          <Table>
            <tbody>

            <tr>
              <td colSpan={2}>orders</td>
              <td colSpan={2}>
                {orders.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Subtotal</td>
              <td colSpan={2} className="currency">
                {subTotal.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Discount</td>
              <td colSpan={2} className="currency">
                {discount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Applied coupon</td>
              <td colSpan={2} className="currency">
                {appliedCoupon.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Delivery charge</td>
              <td colSpan={2} className="currency">
                {deliveryCharge.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Delivery tax</td>
              <td colSpan={2} className="currency">
                {deliveryTAX.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Refunds</td>
              <td colSpan={2} className="currency">
                {refunds.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>Net sales</td>
              <td colSpan={2} className="currency">
                {netSales.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td colSpan={2}>Total Tax</td>
              <td colSpan={2} className="currency">
                {totalTAX.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td colSpan={2}>Gross Sales</td>
              <td colSpan={2} className="currency">
                {grossSales.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td colSpan={2}>Total Tip</td>
              <td colSpan={2} className="currency">
                {totalTip.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td colSpan={2}>HST</td>
              <td colSpan={2} className="currency">
                {hst.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td colSpan={2}>GST</td>
              <td colSpan={2} className="currency">
                {gst.toFixed(2)}
              </td>
            </tr>
            </tbody>
          </Table>
        </Col>
  )
}
export default EndOfTillSales;
