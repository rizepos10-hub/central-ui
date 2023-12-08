import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-crust-thickness.reducer';
import {InputText} from "primereact/inputtext";

export const PizzaCrustThicknessUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaCrustThickness, setPizzaCrustThickness] = useState({
    name: '',
  });

  const pizzaCrustThicknessEntity = useAppSelector(state => state.pizzaCrustThickness.entity);
  const loading = useAppSelector(state => state.pizzaCrustThickness.loading);
  const updating = useAppSelector(state => state.pizzaCrustThickness.updating);
  const updateSuccess = useAppSelector(state => state.pizzaCrustThickness.updateSuccess);

  const handleClose = () => {
    navigate('/pizza-crust' + location.search);
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
    if(pizzaCrustThicknessEntity){
      setPizzaCrustThickness(pizzaCrustThicknessEntity)
    }
  }, [updateSuccess, pizzaCrustThicknessEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaCrustThickness(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...pizzaCrustThickness,
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
          <h2>{isNew ? "Add New Crust Thickness" : "Edit Crust Thickness"}</h2>
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
                  <Label for="pizza-curstThickness-name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="pizza-curstThickness-name"
                    value={pizzaCrustThickness.name}
                    onChange={handleChange}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/pizza-crust" replace color="info">
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

export default PizzaCrustThicknessUpdate;
