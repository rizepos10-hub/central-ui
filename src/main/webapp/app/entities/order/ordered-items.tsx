  import { IBill } from 'app/shared/model/bill.model';
  import { IBilledItem } from 'app/shared/model/billed-items.model';
  import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
  import { Translate } from 'react-jhipster';
  import React from 'react';
  import { IOrderedItem } from 'app/shared/model/ordered-item.model';
  import { IOrderedAddon } from 'app/shared/model/ordered-addon.model';

  interface OrderedItems {
    list: IOrderedItem[];
    totalPayments: number
  }
  export const OrderedItems: React.FC<OrderedItems> = ({ list,totalPayments }) => {
    // addons?: IOrderedAddon[];

    const subtotal = list.reduce((acc, item) => acc + item.price, 0);
    const totalDiscounts = list.reduce((acc, item) => {
      if (item.discount?.type === 'PERCENTAGE') {
        return acc + (item.price * item.discount.value) / 100;
      } else if (item.discount?.type === 'FLAT') {
        return acc + (item.discount.value !== undefined ? item.discount.value : 0);
      } else {
        return acc;
      }
    }, 0);

    const totalPrice = subtotal - totalDiscounts;



    const items = list;
  console.log(items, 'items')
    return (
      <div >
         <h4> <strong>Items</strong></h4>
        <div>
          {list && list.length > 0 ? (
            <ListGroup>
              <ListGroupItem>
                <Row>
                  <Col xs="3">
                    <strong>Name</strong>
                  </Col>
                  <Col xs="3">
                    <strong>Addons</strong>
                  </Col>
                  <Col xs="3">
                    <strong>Discount</strong>
                  </Col>
                  <Col xs="3">
                    <strong>Price</strong>
                  </Col>
                </Row>
              </ListGroupItem>
              {list.map((item: IOrderedItem, i) => (
                <ListGroupItem key={`entity-${i}`} data-cy="entityTable">
                  <Row>
                    <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {item.itemName} <span className="text-sm">({item.variantName})</span>
              </span>
                    </Col>
                    <Col xs="3">
                      {item.addons && item.addons.length > 0 ? (
                        <div>
                          {item.addons.map((addon: IOrderedAddon, j: number) => (
                            <span key={`addon-${j}`} className="font-medium text-lg mb-1">
                      {addon?.name !== '' ? addon.name : 'no'}
                    </span>
                          ))}
                        </div>
                      ) : (
                        <div>No addons</div>
                      )}
                    </Col>
                    <Col xs="3">
              <span>
                {item.discount?.value !== undefined
                  ? `${item.discount.type === 'PERCENTAGE' ? `${item.discount.value}%` : `${item.discount.value} ${item.discount.type}`}`
                  : '0'}
              </span>
                    </Col>
                    <Col xs="3">
                      <span>{item.price}</span>
                    </Col>
                  </Row>
                </ListGroupItem>
              ))}
            </ListGroup>
          ) : (
            <div>No items available.</div>
          )}
        </div>


        { list.length > 0 && <Card className="mt-3 p-3">
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Subtotal</strong>
            </div>
            <div className="text-center">$ {subtotal.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Discounts</strong>
            </div>
            <div className="text-center">$ {totalDiscounts.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Price</strong>
            </div>
            <div className="text-center">$ {totalPrice.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Paid</strong>
            </div>
            <div className="text-center">$ {totalPayments.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Remaining</strong>
            </div>
            <div className="text-center">$ {(totalPrice - totalPayments).toFixed(2) }</div>
          </div>
        </Card>}
      </div>
    );
  };
