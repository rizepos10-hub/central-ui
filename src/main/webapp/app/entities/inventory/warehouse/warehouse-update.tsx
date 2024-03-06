import React, { useEffect, useState } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './warehouse.reducer';
import {InputText} from "primereact/inputtext";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {Checkbox} from "primereact/checkbox";
import {Translate} from "react-jhipster";

export const WarehouseUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [warehouse, setWarehouse] = useState<IWarehouse>({});

  const warehouseEntity = useAppSelector(state => state.warehouse.entity);
  const loading = useAppSelector(state => state.warehouse.loading);
  const updating = useAppSelector(state => state.warehouse.updating);
  const updateSuccess = useAppSelector(state => state.warehouse.updateSuccess);


  const handleClose = () => {
    navigate('/inventory/warehouse' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(warehouseEntity){
      setWarehouse(warehouseEntity)
    }
  }, [updateSuccess, warehouseEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setWarehouse(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...warehouse,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ?  "Add New Warehouse" : "Edit Warehouse"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                  <Label for="name">
                    <Translate contentKey={"tempApp.warehouse.name"}>Name</Translate>
                  </Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="name"
                    value={warehouse.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="location">
                    <Translate contentKey={"tempApp.warehouse.location"}>Location</Translate>
                  </Label>
                  <InputText
                    type="text"
                    name="location"
                    id="location"
                    value={warehouse.location}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex mt-2 gap-2"}>
                  <Label for="main">
                    <Translate contentKey={"tempApp.warehouse.main"}>Main Warehouse</Translate>
                  </Label>
                  <Checkbox
                    name="main"
                    id="main"
                    checked={warehouse?.main}
                    onChange={(e) => setWarehouse((prev) => ({...prev, main: e.checked}))}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/inventory/warehouse" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;Save
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseUpdate;
