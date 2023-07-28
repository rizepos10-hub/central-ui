import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './order.reducer';

export const OrderDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const orderEntity = useAppSelector(state => state.order.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="orderDetailsHeading">
          <Translate contentKey="tempApp.order.detail.title">Order</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{orderEntity.id}</dd>
          <dt>
            <span id="discount">
              <Translate contentKey="tempApp.order.discount">Discount</Translate>
            </span>
          </dt>
          <dd>{orderEntity.discount}</dd>
          <dt>
            <span id="walkin">
              <Translate contentKey="tempApp.order.walkin">Walkin</Translate>
            </span>
          </dt>
          <dd>{orderEntity.walkin ? 'true' : 'false'}</dd>
          <dt>
            <span id="status">
              <Translate contentKey="tempApp.order.status">Status</Translate>
            </span>
          </dt>
          <dd>{orderEntity.status}</dd>
          <dt>
            <span id="branchId">
              <Translate contentKey="tempApp.order.branchId">Branch Id</Translate>
            </span>
          </dt>
          <dd>{orderEntity.branchId}</dd>
          <dt>
            <span id="sourceApp">
              <Translate contentKey="tempApp.order.sourceApp">Source App</Translate>
            </span>
          </dt>
          <dd>{orderEntity.sourceApp}</dd>
          <dt>
            <span id="tables">
              <Translate contentKey="tempApp.order.tables">Tables</Translate>
            </span>
          </dt>
          <dd>{orderEntity.tables}</dd>
        </dl>
        <Button tag={Link} to="/order" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/order/${orderEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default OrderDetail;
