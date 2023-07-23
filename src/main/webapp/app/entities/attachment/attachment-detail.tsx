import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './attachment.reducer';

export const AttachmentDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const attachmentEntity = useAppSelector(state => state.attachment.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="attachmentDetailsHeading">
          <Translate contentKey="tempApp.attachment.detail.title">Attachment</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{attachmentEntity.id}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="tempApp.attachment.name">Name</Translate>
            </span>
          </dt>
          <dd>{attachmentEntity.name}</dd>
          <dt>
            <span id="path">
              <Translate contentKey="tempApp.attachment.path">Path</Translate>
            </span>
          </dt>
          <dd>{attachmentEntity.path}</dd>
          <dt>
            <span id="size">
              <Translate contentKey="tempApp.attachment.size">Size</Translate>
            </span>
          </dt>
          <dd>{attachmentEntity.size}</dd>
          <dt>
            <span id="type">
              <Translate contentKey="tempApp.attachment.type">Type</Translate>
            </span>
          </dt>
          <dd>{attachmentEntity.type}</dd>
          <dt>
            <Translate contentKey="tempApp.attachment.item">Item</Translate>
          </dt>
          <dd>{attachmentEntity.item ? attachmentEntity.item.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/attachment" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/attachment/${attachmentEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default AttachmentDetail;
