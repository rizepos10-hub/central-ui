import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText, FormGroup, Label } from "reactstrap";
import { getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './printer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from "react-select";
import { IBranch } from "app/shared/model/branch.model";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { IPrinter } from "app/shared/model/PRINTER/printer.model";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton";
import { Checkbox } from "primereact/checkbox";


export const PrinterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const CONNECTION_TYPES: IPrinter["connectionType"][] = ["NETWORK", "USB"];
  const SIZES: IPrinter["size"][] = ["mm72", "mm80", "mm58"];


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printerEntity: IPrinter = useAppSelector(state => state.printer.entity);
  const loading = useAppSelector(state => state.printer.loading);
  const updating = useAppSelector(state => state.printer.updating);
  const branchList = useAppSelector(state => state.branch.entities)

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));

    }
    dispatch(getBranches({
      page: 0,
      size: 400,
      sort: `id,asc`,
    }));

  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...printerEntity,
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
            navigate(`/inventory/warehouse/${newId}/edit`)
          }
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
          <h2 id="tempApp.printer.home.createOrEditLabel" data-cy="PrinterCreateUpdateHeading">
            <Translate contentKey="tempApp.printer.home.createOrEditLabel">Create or edit a Printer</Translate>
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-name">{translate('tempApp.printer.name')}</Label>
                  <InputText
                    id="printer-name"
                    value={printerEntity.name || ""}
                    onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-brand">{translate('tempApp.printer.brand')}</Label>
                  <InputText
                    id="printer-brand"
                    value={printerEntity.brand || ""}
                    onChange={e => dispatch(changeEntityField({ name: 'brand', value: e.target.value }))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-model">{translate('tempApp.printer.model')}</Label>
                  <InputText
                    id="printer-model"
                    value={printerEntity.model || ""}
                    onChange={e => dispatch(changeEntityField({ name: 'model', value: e.target.value }))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-connectionType">{translate('tempApp.printer.connectionType')}</Label>
                  <SelectButton
                    value={printerEntity?.connectionType || "NETWORK"}
                    allowEmpty={false}
                    onChange={(e) => {
                      dispatch(changeEntityField({ name: 'connectionType', value: e.value }));
                      dispatch(changeEntityField({ name: 'ipAddress', value: null }));
                      dispatch(changeEntityField({ name: 'port', value: null }));
                      dispatch(changeEntityField({ name: 'serviceName', value: null }));
                    }}
                    options={CONNECTION_TYPES} />
                </div>

                {
                  printerEntity?.connectionType === "NETWORK" ? (
                    <>
                      <div className={"d-flex flex-column mb-3"}>
                        <Label htmlFor="printer-ipAddress">{translate('tempApp.printer.ipAddress')}</Label>
                        <InputText
                          id="printer-ipAddress"
                          value={printerEntity.ipAddress || ""}
                          onChange={e => dispatch(changeEntityField({ name: 'ipAddress', value: e.target.value }))}
                          required
                        />
                      </div>

                      <div className={"d-flex flex-column mb-3"}>
                        <Label htmlFor="printer-port">{translate('tempApp.printer.port')}</Label>
                        <InputNumber
                          id="printer-port"
                          value={printerEntity.port || 0}
                          onChange={e => dispatch(changeEntityField({ name: 'port', value: e.value }))}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className={"d-flex flex-column mb-3"}>
                      <Label htmlFor="printer-serviceName">{translate('tempApp.printer.serviceName')}</Label>
                      <InputText
                        id="printer-serviceName"
                        value={printerEntity.serviceName || ""}
                        onChange={e => dispatch(changeEntityField({ name: 'serviceName', value: e.target.value }))}
                        required
                      />
                    </div>
                  )
                }


                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-printSpeed">{translate('tempApp.printer.printSpeed')}</Label>
                  <InputNumber
                    id="printer-printSpeed"
                    value={printerEntity.printSpeed || 0}
                    onChange={e => dispatch(changeEntityField({ name: 'printSpeed', value: e.value }))}
                    required
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-branch">{translate('tempApp.printer.branch')}</Label>
                  <Select
                    name={"printer-branch"}
                    options={branchList}
                    getOptionLabel={(option: IBranch) => option.name}
                    getOptionValue={(option: IBranch) => option.id}
                    value={printerEntity?.branch || null}
                    placeholder="Branch Name"
                    onChange={(selectedBranch: IBranch) => dispatch(changeEntityField({ name: 'branch', value: selectedBranch }))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-size">{translate('tempApp.printer.size')}</Label>
                  <SelectButton
                    value={printerEntity?.size || "mm72"}
                    allowEmpty={false}
                    onChange={(e) => dispatch(changeEntityField({ name: 'size', value: e.value }))}
                    options={SIZES} />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="printer-colorPrinter">{translate('tempApp.printer.colorPrinter')}</Label>
                  <Checkbox
                    checked={printerEntity?.colorPrinter}
                    onChange={(e) => dispatch(changeEntityField({ name: 'colorPrinter', value: e.checked }))} />
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

export default PrinterUpdate;
