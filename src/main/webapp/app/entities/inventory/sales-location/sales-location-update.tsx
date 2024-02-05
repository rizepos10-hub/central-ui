import React, { useEffect, useState } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './sales-location.reducer';
import {InputText} from "primereact/inputtext";
import {ISalesLocation} from "app/shared/model/STOCK/sales-location.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {Translate} from "react-jhipster";
import Select from "react-select";
import {IBranch} from "app/shared/model/branch.model";

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
  const updateSuccess = useAppSelector(state => state.salesLocation.updateSuccess);



  const handleClose = () => {
    navigate('/inventory/sales-location' + location.search);
  };

  const handleBranchChange = (selectedBranch: IBranch) => {
    setSalesLocation(prevState => ({...prevState, branch: selectedBranch}))
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
    if (updateSuccess) {
      handleClose();
    }
    if(salesLocationEntity){
      setSalesLocation(salesLocationEntity)
    }
  }, [updateSuccess, salesLocationEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setSalesLocation(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...salesLocation,
      branch: (salesLocation.branch as IBranch).id
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
          <h2>{isNew ?  "Add New Sales Location" : "Edit Sales Location"}</h2>
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
                    value={salesLocation.name}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="location">Location</Label>
                  <InputText
                    type="text"
                    name="location"
                    id="location"
                    value={salesLocation.location}
                    onChange={handleChange}
                  />
                </div>

                <div className={"d-flex flex-column"}>
                  <label className={"mt-2"}>
                    <Translate contentKey={"tempApp.table.branch"}>Branch</Translate>
                  </label>
                  <Select
                    options={branchList}
                    onChange={handleBranchChange}
                    getOptionValue={(option: IBranch) => option.id}
                    getOptionLabel={(option: IBranch) => option.name}
                    name={"branch"}
                    value={salesLocation.branch}
                  />
                </div>

              </FormGroup>
              <Button tag={Link} to="/inventory/sales-location" replace color="info">
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

export default SalesLocationUpdate;
