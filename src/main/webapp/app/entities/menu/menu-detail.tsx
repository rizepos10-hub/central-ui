import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Row, Col, Card, CardBody } from 'reactstrap';
import { Translate, TextFormat } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntity, sendEvent} from './menu.reducer';

const MenuDetail = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));

    return () => {};
  }, [dispatch, id]);

  const menuEntity = useAppSelector(state => state.menu.entity);
  console.log(menuEntity?.item?.map(item => item), 'menut');

  return (
    <Row>
      <Col md="8">
        <h2 data-cy="menuDetailsHeading">
          <Translate contentKey="tempApp.menu.detail.title">Menu</Translate>
        </h2>

        <Card>
          <CardBody>
            <h5>
              <Translate contentKey="tempApp.menu.name">Name</Translate>: {menuEntity.name}
            </h5>
            <p>
              <Translate contentKey="global.field.id">ID</Translate>: {menuEntity.id}
            </p>
            <p>
              <Translate contentKey="tempApp.menu.createdAt">Created At</Translate>:{' '}
              {menuEntity.createdAt ? <TextFormat value={menuEntity.createdAt} type="date" format={APP_DATE_FORMAT} /> : null}
            </p>
            <p>
              <Translate contentKey="tempApp.menu.updatedAt">Updated At</Translate>:{' '}
              {menuEntity.updatedAt ? <TextFormat value={menuEntity.updatedAt} type="date" format={APP_DATE_FORMAT} /> : null}
            </p>
            <p>
              <Translate contentKey="tempApp.menu.category">Category</Translate>:{' '}
              {menuEntity.category ? menuEntity.category.id : ''}
            </p>
          </CardBody>
        </Card>
        <Row className="mt-4 align-items-center justify-content-center">
          {menuEntity?.item?.map(item => (
            <Col key={item.id} md="3" className="mb-4 d-flex align-items-center justify-content-center">
              <Card
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor:
                    item.terms[0]?.name === 'Salads'
                      ? '#32CD32'
                      : item.terms[0]?.name === 'Drinks'
                        ? '#4169E1'
                        : item.terms[0]?.name === 'Starters'
                          ? '#CD7F32'
                          : 'silver',
                  width: '180px',
                  height: '180px',
                }}
              >
                <CardBody className="d-flex align-items-center justify-content-cente h-100r" >
                  <h5 style={{ textAlign: 'center', fontFamily: 'cursive' }}>{item.name}</h5>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>




        <Button tag={Link} to="/menu" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/menu/${menuEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>

      <Col md="4" className="d-flex justify-content-end " >
        <Button onClick={() => dispatch(sendEvent(id))} className="btn btn-success rounded col-12" style={{height: '20rem', fontSize: '5rem', fontFamily: 'fantasy'}}>
          Trigger
        </Button>
      </Col>
    </Row>
  );
};

export default MenuDetail;
