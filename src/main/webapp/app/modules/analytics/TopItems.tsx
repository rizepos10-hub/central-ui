import React, { useEffect, useState } from 'react';
import { fetchTopCustomers, fetchTopItems } from 'app/modules/analytics/api';
import { Col, ListGroup, ListGroupItem, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import ImageDisplay from 'app/shared/components/image/image-display';

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
    <div className="container mt-5">
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h4 className="card-title">
                <Translate contentKey={'analytics.topItems.title'}>Best Sellers</Translate>
              </h4>

              <ListGroup>
                {bestSellers && (
                  <ListGroupItem>
                    <Row>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.topItems.name'}>Name</Translate>
                        </strong>
                      </Col>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.topItems.variant'}>Variant</Translate>
                        </strong>
                      </Col>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.topItems.count'}>Order Count</Translate>
                        </strong>
                      </Col>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.topItems.image'}>Image</Translate>
                        </strong>
                      </Col>
                    </Row>
                  </ListGroupItem>
                )}
                {bestSellers
                  .filter(item => item.itemId !== null)
                  .map((item, index) => (
                    <ListGroupItem key={`entity-${index}`} data-cy="entityTable">
                      <Row>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{item.itemName}</span>
                        </Col>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{item.variantName}</span>
                        </Col>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{item.orderCount}</span>
                        </Col>
                        <Col xs="3">
                          <ImageDisplay
                            imageType={'product'}
                            imageUrl={item?.attachments?.[0]?.url || item?.variants?.[0]?.attachments?.[0]?.url}
                            height={50}
                            width={50}
                          />
                        </Col>
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
              <h4 className="card-title">
                <Translate contentKey={'analytics.bestCustomers.title'}>Best Customers</Translate>
              </h4>
              <ListGroup>
                {bestCustomers && (
                  <ListGroupItem>
                    <Row>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.bestCustomers.name'}>Customer Name</Translate>
                        </strong>
                      </Col>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.bestCustomers.orders'}>Orders</Translate>
                        </strong>
                      </Col>
                      <Col xs="3">
                        <strong>
                          <Translate contentKey={'analytics.bestCustomers.phone'}>Phone Number</Translate>
                        </strong>
                      </Col>
                    </Row>
                  </ListGroupItem>
                )}
                {bestCustomers.map((customer, index) => {
                  const customerName = `${customer?.firstName ?? ''} ${customer.lastName ?? ''}`;
                  return (
                    <ListGroupItem key={`entity-${index}`} data-cy="entityTable">
                      <Row>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{customerName.trim() !== '' ? customerName : customer?.id}</span>
                        </Col>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{customer.count}</span>
                        </Col>
                        <Col xs="3">
                          <span className="font-medium text-lg mb-1">{customer.phone}</span>
                        </Col>
                      </Row>
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopItems;
