import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './supplier.reducer';
import { InputText } from "primereact/inputtext";
import { ISupplier } from "app/shared/model/STOCK/supplier.model";
import { translate, Translate } from "react-jhipster";

export const SupplierUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [supplier, setSupplier] = useState<ISupplier>({
    name: '',
    address: '',
    phoneNumber: null,
    email: ''
  });

  const supplierEntity = useAppSelector(state => state.supplier.entity);
  const loading = useAppSelector(state => state.supplier.loading);
  const updating = useAppSelector(state => state.supplier.updating);


  const handleClose = () => {
    navigate('/inventory/supplier' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (supplierEntity) {
      setSupplier(supplierEntity)
    }
  }, [supplierEntity?.name]);

  const handleChange = e => {

    const { name, value } = e.target;
    setSupplier(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...supplier,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/inventory/supplier/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/supplier/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? `${translate("tempApp.supplier.createNew")}` : `${translate("tempApp.supplier.edit")}`}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                  <Label for="name">
                    <Translate contentKey={"common.name"} />
                  </Label>
                  <InputText
                    type="text"
                    name="name"
                    required={true}
                    id="name"
                    value={supplier.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Translate contentKey={"common.address"} />
                  <InputText
                    type="text"
                    name="address"
                    id="address"
                    value={supplier.address || ''}
                    onChange={handleChange}
                  />
                </div>


                <div className={"d-flex flex-column gap-2 mt-2"}>
                  <strong><label className={"text-xl"}>
                    <Translate contentKey={"common.contactInformation"} />
                  </label></strong>
                  <div className={"d-flex flex-column"}>
                    <Label for="email">
                      <Translate contentKey={"common.email"} />
                    </Label>
                    <InputText
                      type="email"
                      name="email"
                      id="email"
                      value={supplier?.email || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={"d-flex flex-column"}>
                    <Label for="phoneNumber">
                      <Translate contentKey={"common.phone"} />
                    </Label>
                    <InputText
                      name="phoneNumber"
                      id="phoneNumber"
                      value={supplier?.phoneNumber || ''}
                      onChange={handleChange}
                    />
                  </div>
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

export default SupplierUpdate;
