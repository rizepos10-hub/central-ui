import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './warehouse.reducer';
import { InputText } from "primereact/inputtext";
import { IWarehouse } from "app/shared/model/STOCK/warehouse.model";
import { Checkbox } from "primereact/checkbox";
import { translate, Translate } from "react-jhipster";

export const WarehouseUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [warehouse, setWarehouse] = useState<IWarehouse>({});

  const warehouseEntity = useAppSelector(state => state.warehouse.entity);
  const loading = useAppSelector(state => state.warehouse.loading);
  const updating = useAppSelector(state => state.warehouse.updating);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (warehouseEntity) {
      setWarehouse(warehouseEntity)
    }
  }, [warehouseEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setWarehouse(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...warehouse,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/inventory/warehouse/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/warehouse/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? `${translate('tempApp.warehouse.createNew')}` : `${translate('tempApp.warehouse.edit')}`}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={'d-flex flex-column'}>
                  <Label for="name">
                    <Translate contentKey={'common.name'}>Name</Translate>
                  </Label>
                  <InputText type="text" name="name" required={true} id="name" value={warehouse.name || ''} onChange={handleChange} />
                </div>

                <div className={'d-flex flex-column mt-2'}>
                  <Label for="location">
                    <Translate contentKey={'common.location'}>Location</Translate>
                  </Label>
                  <InputText type="text" name="location" id="location" value={warehouse.location || ''} onChange={handleChange} />
                </div>

                <div className={'d-flex mt-2 gap-2'}>
                  <Label for="main">
                    <Translate contentKey={'tempApp.warehouse.main'}>Main Warehouse</Translate>
                  </Label>
                  <Checkbox
                    name="main"
                    id="main"
                    checked={warehouse?.main}
                    onChange={e => setWarehouse(prev => ({ ...prev, main: e.checked }))}
                  />
                </div>
              </FormGroup>
              <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              &nbsp;
              <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseUpdate;
