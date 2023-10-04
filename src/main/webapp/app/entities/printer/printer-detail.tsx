import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './printer.reducer';

export const PrinterDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const printerEntity = useAppSelector(state => state.printer.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="printerDetailsHeading">
          <Translate contentKey="tempApp.printer.detail.title">Printer</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{printerEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.printer.name">Name</Translate>
            </span>
          </dt>
          <dd>{printerEntity.name}</dd>
          <dt>
            <span id="desc">
              <Translate contentKey="tempApp.printer.desc">Desc</Translate>
            </span>
          </dt>
          <dd>{printerEntity.desc}</dd>
          <dt>
            <span id="price">
              <Translate contentKey="tempApp.printer.price">Price</Translate>
            </span>
          </dt>
          <dd>{printerEntity.price}</dd>
          <dt>
            <Translate contentKey="tempApp.printer.item">Item</Translate>
          </dt>
          <dd>{printerEntity.item ? printerEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/printer" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/printer/${printerEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default PrinterDetail;
