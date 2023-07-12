import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './addon.reducer';

export const AddonDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const addonEntity = useAppSelector(state => state.addon.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="addonDetailsHeading">
          <Translate contentKey="centralApp.addon.detail.title">Addon</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{addonEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="centralApp.addon.name">Name</Translate>
            </span>
          </dt>
          <dd>{addonEntity.name}</dd>
          <dt>
            <span id="desc">
              <Translate contentKey="centralApp.addon.desc">Desc</Translate>
            </span>
          </dt>
          <dd>{addonEntity.desc}</dd>
          <dt>
            <span id="price">
              <Translate contentKey="centralApp.addon.price">Price</Translate>
            </span>
          </dt>
          <dd>{addonEntity.price}</dd>
          <dt>
            <Translate contentKey="centralApp.addon.item">Item</Translate>
          </dt>
          <dd>{addonEntity.item ? addonEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/addon" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/addon/${addonEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default AddonDetail;
