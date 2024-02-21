import React, { useEffect, useState } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './item-measure.reducer';
import {InputText} from "primereact/inputtext";
import {IItemMeasure} from "app/shared/model/item-measure.model";

export const ItemMeasureUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [itemMeasure, setItemMeasure] = useState<IItemMeasure>({
    name: '',
    code: '',
  });

  const itemMeasureEntity = useAppSelector(state => state.itemMeasure.entity);
  const loading = useAppSelector(state => state.itemMeasure.loading);
  const updating = useAppSelector(state => state.itemMeasure.updating);
  const updateSuccess = useAppSelector(state => state.itemMeasure.updateSuccess);


  const handleClose = () => {
    navigate('/item-measure' + location.search);
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
    if(itemMeasureEntity){
      setItemMeasure(itemMeasureEntity)
    }
  }, [updateSuccess, itemMeasureEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target ;
    setItemMeasure(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...itemMeasure,
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
          <h2>{isNew ?  "Add New Item Measure" : "Edit Item Measure"}</h2>
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
                  <Label for="name">Name</Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="name"
                    value={itemMeasure.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="code">Code</Label>
                  <InputText
                    type="text"
                    name="code"
                    id="code"
                    value={itemMeasure.code}
                    onChange={handleChange}
                  />
                </div>

              </FormGroup>
              <Button tag={Link} to="/item-measure" replace color="info">
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

export default ItemMeasureUpdate;
