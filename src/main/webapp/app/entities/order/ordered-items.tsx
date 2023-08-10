  import { IBill } from 'app/shared/model/bill.model';
  import { IBilledItem } from 'app/shared/model/billed-items.model';
  import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
  import { Translate } from 'react-jhipster';
  import React from 'react';
  import { IOrderedItem } from 'app/shared/model/ordered-item.model';
  import { IOrderedAddon } from 'app/shared/model/ordered-addon.model';

  interface OrderedItems {
    list: IOrderedItem[];
  }
  export const OrderedItems: React.FC<OrderedItems> = ({ list }) => {
    // addons?: IOrderedAddon[];

    const subtotal = list.reduce((acc, item) => acc + item.price, 0);
    const totalDiscounts = list.reduce((acc, item) => acc + item.discount, 0);
    const totalPrice = subtotal - totalDiscounts;


    const items = list;
  console.log(items, 'items')
    return (
      <div >
         <h4> <strong>Items</strong></h4>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {list && list.length > 0 ? (
            <ListGroup>
              {list.map((item, i) => (
                <ListGroupItem key={`entity-${i}`} data-cy="entityTable">
                  <Row>
                    <Col xs="3">
                      <div className="d-flex flex-column">
                        <strong>Name</strong> {item.id}
                      </div>
                    </Col>
                    <Col xs="3">

                      <strong>Addons</strong>
                      {item.addons && item.addons.length > 0 && (
                        <div className="d-flex flex-column">
                          {item.addons.map((addon: IOrderedAddon, j: number) => (
                            <span key={`addon-${j}`}>{addon?.id}</span>
                          ))}
                        </div>
                      )}
                    </Col>
                    <Col xs="3">
                      <div className="d-flex flex-column">
                        <strong>Discount</strong> {item.discount}
                      </div>
                    </Col>
                    <Col xs="3">
                      <div className="d-flex flex-column">
                        <strong>Price</strong> {item.price}
                      </div>
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
            <div className="text-center">$ {subtotal}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Discounts</strong>
            </div>
            <div className="text-center">$ {totalDiscounts}</div>
          </div>
          <div className="d-flex justify-content-between my-2">
            <div>
              <strong>Total Price</strong>
            </div>
            <div className="text-center">$ {totalPrice}</div>
          </div>
        </Card>}
      </div>
    );
  };
