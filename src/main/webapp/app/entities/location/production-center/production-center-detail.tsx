import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './production-center.reducer';

export const ProductionCenterDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const productionCenterEntity = useAppSelector(state => state.productionCenter.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="productionCenterDetailsHeading">
          <Translate contentKey="tempApp.productionCenter.detail.title">Printer</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{productionCenterEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.productionCenter.name">Name</Translate>
            </span>
          </dt>
          <dd>{productionCenterEntity.name}</dd>
          <dt>
            <span id="desc">
              <Translate contentKey="tempApp.productionCenter.desc">Desc</Translate>
            </span>
          </dt>
          <dd>{productionCenterEntity.desc}</dd>
          <dt>
            <span id="price">
              <Translate contentKey="tempApp.productionCenter.price">Price</Translate>
            </span>
          </dt>
          <dd>{productionCenterEntity.price}</dd>
          <dt>
            <Translate contentKey="tempApp.productionCenter.item">Item</Translate>
          </dt>
          <dd>{productionCenterEntity.item ? productionCenterEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/productionCenter" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/productionCenter/${productionCenterEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default ProductionCenterDetail;
