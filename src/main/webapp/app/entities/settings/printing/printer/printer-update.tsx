import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IItem } from 'app/shared/model/item.model';
import { getEntities as getItems } from 'app/entities/item/restaurant/regalar-item/item.reducer';
import { IPrinter } from 'app/shared/model/printer.model';
import { getEntity, updateEntity, createEntity, reset } from './printer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from "react-select";
import value from "*.json";
import {IBranch} from "app/shared/model/branch.model";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";


export const PrinterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const items = useAppSelector(state => state.item.entities);
  const printerEntity = useAppSelector(state => state.printer.entity);
  const loading = useAppSelector(state => state.printer.loading);
  const updating = useAppSelector(state => state.printer.updating);
  const updateSuccess = useAppSelector(state => state.printer.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities)
  const initialBranches = {label : printerEntity?.branch?.name , value: printerEntity?.branch?.id}

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [selectedBranch, setSelectedBranch] = useState<{ value: string; label: string; id: string; } | undefined>();


  const handleClose = () => {
    navigate('/printer' + location.search);
  };

  const handleBranchChange = (selectedBranch) => {
    console.log(selectedBranch, 'lol branch')
    setSelectedBranch(selectedBranch);
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));

    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getItems({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  useEffect(() => {

    if(printerEntity.branch){
      setSelectedBranch(printerEntity.branch.id)
    }

    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess,printerEntity]);

  console.log(printerEntity, 'printerEntity')
  console.log(selectedBranch, 'selectedBranch')


  const saveEntity = values => {
    console.log(values, 'values')
    console.log(printerEntity, 'printerEntity')
    const entity = {
      ...printerEntity,
      ...values,
      branch: selectedBranch && { id: selectedBranch},
    };

    console.log(entity, 'entity sent')

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  console.log(selectedBranch, 'selectedBranch,')

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...printerEntity,
      branch : selectedBranch
        };


  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.printer.home.createOrEditLabel" data-cy="PrinterCreateUpdateHeading">
            <Translate contentKey="tempApp.printer.home.createOrEditLabel">Create or edit a Printer</Translate>
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="printer-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
            <ValidatedField
                label={translate('tempApp.printer.name')}
                id="printer-name"
                name="name"
                data-cy="name"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                }}
              />
            <ValidatedField label={translate('tempApp.printer.ipAddress')} id="printer-ipAddress" name="ipAddress" data-cy="ipAddress" type="text"/>

            <ValidatedField label={translate('tempApp.printer.brand')} id="printer-brand" name="brand" data-cy="brand" type="text"/>
            <ValidatedField label={translate('tempApp.printer.model')} id="printer-model" name="model" data-cy="model" type="text"/>
            <ValidatedField label={translate('tempApp.printer.colorPrinter')} id="printer-colorPrinter" name="colorPrinter" data-cy="colorPrinter" type="checkbox"/>

            <ValidatedField
                label={translate('tempApp.printer.printSpeed')}
                id="printer-printSpeed"
                name="printSpeed"
                data-cy="printSpeed"
                type="text"
                validate={{
                  validate: v => isNumber(v) || "Numbers Only",
                }}
              />
              <ValidatedField label={translate('tempApp.printer.branch')}
                              value={selectedBranch} id="printer-branch" name="branch"
                              data-cy="branch" type="select"
                              onChange={(e:any) => setSelectedBranch(e.target.value)}
                              validate={{
                                required: { value: true, message: translate('entity.validation.required') },
                              }}
              >
                {isNew && <option value={''}>
                  {''}
                </option>}
                {branchList?.map((branch, i) => (
                  <option value={branch.id} key={i}>
                    {branch.name}
                  </option>
                ))}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/printer" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PrinterUpdate;
