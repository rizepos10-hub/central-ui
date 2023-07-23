import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './term.reducer';

export const TermDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const termEntity = useAppSelector(state => state.term.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="termDetailsHeading">
          <Translate contentKey="tempApp.term.detail.title">Term</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{termEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.term.name">Name</Translate>
            </span>
          </dt>
          <dd>{termEntity.name}</dd>
          <dt>
            <Translate contentKey="tempApp.term.taxonomy">Taxonomy</Translate>
          </dt>
          <dd>{termEntity.taxonomy ? termEntity.taxonomy.id : ''}</dd>
          <dt>
            <Translate contentKey="tempApp.term.term">Term</Translate>
          </dt>
          <dd>{termEntity.term ? termEntity.term.id : ''}</dd>
          <dt>
            <Translate contentKey="tempApp.term.item">Item</Translate>
          </dt>
          <dd>{termEntity.item ? termEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/term" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/term/${termEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default TermDetail;
