import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './discount.reducer';

export const DiscountDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const discountEntity = useAppSelector(state => state.discount.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="discountDetailsHeading">
          <Translate contentKey="tempApp.discount.detail.title">Discount</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{discountEntity.id}</dd>
          <dt>
            <span id="value">
              <Translate contentKey="tempApp.discount.value">Value</Translate>
            </span>
          </dt>
          <dd>{discountEntity.value}</dd>
          <dt>
            <span id="type">
              <Translate contentKey="tempApp.discount.type">Type</Translate>
            </span>
          </dt>
          <dd>{discountEntity.type}</dd>
          <dt>
            <Translate contentKey="tempApp.discount.addon">Addon</Translate>
          </dt>
          <dd>{discountEntity.addon ? discountEntity.addon.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/discount" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/discount/${discountEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default DiscountDetail;
