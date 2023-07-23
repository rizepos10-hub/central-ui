import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './branch.reducer';

export const BranchDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const branchEntity = useAppSelector(state => state.branch.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="branchDetailsHeading">
          <Translate contentKey="tempApp.branch.detail.title">Branch</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{branchEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.branch.name">Name</Translate>
            </span>
          </dt>
          <dd>{branchEntity.name}</dd>
          <dt>
            <span id="appId">
              <Translate contentKey="tempApp.branch.appId">App Id</Translate>
            </span>
          </dt>
          <dd>{branchEntity.appId}</dd>
          <dt>
            <span id="numberOfEmployees">
              <Translate contentKey="tempApp.branch.numberOfEmployees">Number Of Employees</Translate>
            </span>
          </dt>
          <dd>{branchEntity.numberOfEmployees}</dd>
          <dt>
            <Translate contentKey="tempApp.branch.menu">Menu</Translate>
          </dt>
          <dd>{branchEntity.menu ? branchEntity.menu.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/branch" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/branch/${branchEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default BranchDetail;
