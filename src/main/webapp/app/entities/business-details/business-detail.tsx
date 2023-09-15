import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './business-detail.reducer';

export const BusinessDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const businessDetailEntity = useAppSelector(state => state.businessDetail.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="userDetailsHeading">
          <Translate contentKey="tempApp.user.detail.title">User</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="tempApp.businessDetail.name">Name</Translate>
            </span>
          </dt>
          <dd>{`${businessDetailEntity.businessName} ${businessDetailEntity.name}`}</dd>
          <dt>
            <span id="email">
              <Translate contentKey="tempApp.user.email">Email</Translate>
            </span>
          </dt>
          <dd>{businessDetailEntity.email}</dd>
          <dt>
            <span id="phone">
              <Translate contentKey="tempApp.user.phone">Phone</Translate>
            </span>
          </dt>
          <dd>{businessDetailEntity.phone}</dd>
          {/* <dt> */}
          {/*   <span id="status"> */}
          {/*     <Translate contentKey="tempApp.back-office-user.status">Status</Translate> */}
          {/*   </span> */}
          {/* </dt> */}
          {/* <dd>{businessDetailEntity.status}</dd> */}
        </dl>
        <Button tag={Link} to="/user" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/user/${businessDetailEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default BusinessDetail;
