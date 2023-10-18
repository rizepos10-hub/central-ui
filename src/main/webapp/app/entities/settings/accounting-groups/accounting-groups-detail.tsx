import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './accounting-groups.reducer';

export const AccountingGroupsDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const taxEntity = useAppSelector(state => state.tax.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="taxDetailsHeading">
          <Translate contentKey="tempApp.tax.detail.title">Tax</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{taxEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.tax.name">Name</Translate>
            </span>
          </dt>
          <dd>{taxEntity.name}</dd>
          <dt>
            <span id="desc">
              <Translate contentKey="tempApp.tax.desc">Desc</Translate>
            </span>
          </dt>
          <dd>{taxEntity.desc}</dd>
          <dt>
            <span id="price">
              <Translate contentKey="tempApp.tax.price">Price</Translate>
            </span>
          </dt>
          <dd>{taxEntity.price}</dd>
          <dt>
            <Translate contentKey="tempApp.tax.item">Item</Translate>
          </dt>
          <dd>{taxEntity.item ? taxEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/tax" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/tax/${taxEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default AccountingGroupsDetail;
