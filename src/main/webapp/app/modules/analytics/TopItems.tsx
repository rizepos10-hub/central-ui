import React, { useEffect, useState } from 'react';
import { fetchTopCustomers, fetchTopItems } from 'app/modules/analytics/api';
import {Col, ListGroup, ListGroupItem, Row} from "reactstrap";

const TopItems = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [bestCustomers, setBestCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const topItemsData = await fetchTopItems();
      setBestSellers(topItemsData);

      const topCustomersData = await fetchTopCustomers();
      setBestCustomers(topCustomersData);
    };
    fetchData();
  }, []);

  return (
    <div className="container mt-5" >
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow" >
            <div className="card-body">
              <h4 className="card-title">Best Sellers</h4>
              <ListGroup>

                {bestSellers &&
                    <ListGroupItem>
                      <Row>
                        <Col xs="3">
                          <strong>Name</strong>
                        </Col>
                        <Col xs="3">
                          <strong>Variant</strong>
                        </Col>
                        <Col xs="3">
                          <strong>Discount</strong>
                        </Col>
                        <Col xs="3">
                          <strong>Price</strong>
                        </Col>
                      </Row>
                    </ListGroupItem>}
                {bestSellers.map((item, index) => (
                  <ListGroupItem key={`entity-${index}`} data-cy="entityTable">
                    <Row>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {item.itemName}
              </span>
                      </Col>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {item.variantName}
              </span>
                      </Col>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {item.orderCount}
              </span>
                      </Col>
                      <img
                        src={
                          item?.variantAttachments && item?.variantAttachments.length > 0
                            ? item?.variantAttachments[0]?.url
                            : item?.itemAttachments && item?.itemAttachments.length > 0
                              ? item?.itemAttachments[0]?.url
                              : null
                        }
                        alt="Best Seller"
                        style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                      />
                    </Row>
                    </ListGroupItem>

                  ))}
                  </ListGroup>

            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h4 className="card-title">Best Customers</h4>
                <ListGroup>
                {bestCustomers &&
                  <ListGroupItem>
                    <Row>
                      <Col xs="3">
                        <strong>Customer Name</strong>
                      </Col>
                      <Col xs="3">
                        <strong>Orders</strong>
                      </Col>
                      <Col xs="3">
                        <strong>Phone Number
                        </strong>
                      </Col>

                    </Row>
                  </ListGroupItem>}
                {bestCustomers.map((customer, index) => (
                  <ListGroupItem key={`entity-${index}`} data-cy="entityTable">
                    <Row>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {customer.firstName} {customer.lastName}
              </span>
                      </Col>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {customer.count}
              </span>
                      </Col>
                      <Col xs="3">
              <span className="font-medium text-lg mb-1">
                {customer.phone}
              </span>
                      </Col>

                    </Row>
                  </ListGroupItem>

                ))}
              </ListGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopItems;
