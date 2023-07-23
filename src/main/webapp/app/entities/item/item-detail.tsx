import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './item.reducer';

export const ItemDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const itemEntity = useAppSelector(state => state.item.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="itemDetailsHeading">
          <Translate contentKey="tempApp.item.detail.title">Item</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{itemEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.item.name">Name</Translate>
            </span>
          </dt>
          <dd>{itemEntity.name}</dd>
          <dt>
            <span id="desc">
              <Translate contentKey="tempApp.item.desc">Desc</Translate>
            </span>
          </dt>
          <dd>{itemEntity.desc}</dd>
          <dt>
            <span id="orderCount">
              <Translate contentKey="tempApp.item.orderCount">Order Count</Translate>
            </span>
          </dt>
          <dd>{itemEntity.orderCount}</dd>
          <dt>
            <span id="avgRating">
              <Translate contentKey="tempApp.item.avgRating">Avg Rating</Translate>
            </span>
          </dt>
          <dd>{itemEntity.avgRating}</dd>
          <dt>
            <span id="ratingCount">
              <Translate contentKey="tempApp.item.ratingCount">Rating Count</Translate>
            </span>
          </dt>
          <dd>{itemEntity.ratingCount}</dd>
          <dt>
            <span id="stock">
              <Translate contentKey="tempApp.item.stock">Stock</Translate>
            </span>
          </dt>
          <dd>{itemEntity.stock}</dd>
          <dt>
            <span id="status">
              <Translate contentKey="tempApp.item.status">Status</Translate>
            </span>
          </dt>
          <dd>{itemEntity.status}</dd>
          <dt>
            <Translate contentKey="tempApp.item.menu">Menu</Translate>
          </dt>
          <dd>{itemEntity.menu ? itemEntity.menu.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/item" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/item/${itemEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default ItemDetail;
