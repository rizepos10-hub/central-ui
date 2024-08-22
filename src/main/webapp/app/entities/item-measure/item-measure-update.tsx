import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card as PrimeCard } from 'primereact/card'

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './item-measure.reducer';
import { InputText } from "primereact/inputtext";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { Translate } from 'react-jhipster';

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

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (itemMeasureEntity) {
      setItemMeasure(itemMeasureEntity)
    }
  }, [itemMeasureEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setItemMeasure(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...itemMeasure,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/item-measure/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/item-measure/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Item Measure" : "Edit Item Measure"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={"d-flex flex-column"}>
                    <Label for="name">Name</Label>
                    <InputText
                      type="text"
                      name="name"
                      required={true}
                      id="name"
                      value={itemMeasure.name || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={"d-flex flex-column mt-2"}>
                    <Label for="code">Code</Label>
                    <InputText
                      type="text"
                      name="code"
                      id="code"
                      value={itemMeasure.code || ''}
                      onChange={handleChange}
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
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default ItemMeasureUpdate;
