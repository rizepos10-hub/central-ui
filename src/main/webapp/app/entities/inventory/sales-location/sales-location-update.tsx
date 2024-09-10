import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './sales-location.reducer';
import { InputText } from "primereact/inputtext";
import { ISalesLocation } from "app/shared/model/STOCK/sales-location.model";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { translate, Translate } from "react-jhipster";
import Select from "react-select";
import { IBranch } from "app/shared/model/branch.model";

export const SalesLocationUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [salesLocation, setSalesLocation] = useState<ISalesLocation>({
    name: '',

  });
  const branchList = useAppSelector(state => state.branch.entities);
  const salesLocationEntity = useAppSelector(state => state.salesLocation.entity);
  const loading = useAppSelector(state => state.salesLocation.loading);
  const updating = useAppSelector(state => state.salesLocation.updating);

  const handleBranchChange = (selectedBranch: IBranch) => {
    setSalesLocation(prevState => ({ ...prevState, branch: selectedBranch }))
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }))
  }, []);

  useEffect(() => {
    if (salesLocationEntity) {
      setSalesLocation(salesLocationEntity)
    }
  }, [salesLocationEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setSalesLocation(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity: ISalesLocation = {
      ...salesLocation,
      type: "SALES_LOCATION"
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
            navigate(`/inventory/sales-location/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/sales-location/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? `${translate("tempApp.salesLocation.createNew")}` : `${translate("tempApp.salesLocation.edit")}`}</h2>
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
                    value={salesLocation.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="location">
                    <Translate contentKey={"common.location"} />
                  </Label>
                  <InputText
                    type="text"
                    name="location"
                    id="location"
                    value={salesLocation.location || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.table.branch"}>
                      Branch
                    </Translate>
                  </label>
                  <Select
                    options={branchList}
                    onChange={handleBranchChange}
                    getOptionValue={(option: IBranch) => option.id}
                    getOptionLabel={(option: IBranch) => option.name}
                    name={"branch"}
                    value={salesLocation.branch || null}
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

export default SalesLocationUpdate;
