import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPrintingProfile } from 'app/shared/model/PRINTER/printing-profile.model';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './printing-profile.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getPrinters } from 'app/entities/settings/printing/printer/printer.reducer';

import Select from 'react-select';
import { InputText } from 'primereact/inputtext';
import { getSortState, Translate } from 'react-jhipster';
import { Checkbox } from 'primereact/checkbox';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IBranch } from 'app/shared/model/branch.model';

export const PrintingProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printersList = useAppSelector(state => state.printer.entities);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const printingProfile: IPrintingProfile = useAppSelector(state => state.printingProfiles.entity);
  const updating = useAppSelector(state => state.printingProfiles.updating);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const formData = {
      ...printingProfile,
    };

    if (isNew) {
      dispatch(createEntity(formData)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/printing-profiles/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(formData)).then(() => {
        if (createNew) {
          navigate(`/printing-profiles/new`)
        }
      })
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getPrinters({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  const togglePrinterSelection = (printerId) => {
    const selectedPrinter = printersList.find((printer) => printer.id === printerId);
    if (!selectedPrinter) return;

    const updatedPrinters = printingProfile.printers || [];
    const printerIndex = updatedPrinters.findIndex((printer) => printer.id === printerId);

    let newPrinters;
    if (printerIndex !== -1) {
      newPrinters = updatedPrinters.filter((printer) => printer.id !== printerId);
    } else {
      newPrinters = [...updatedPrinters, { id: selectedPrinter.id, label: selectedPrinter.name, value: selectedPrinter.id }];
    }
    dispatch(changeEntityField({ name: 'printers', value: newPrinters }));
  };

  return (
    <Row>
      <h2>{isNew ? `Add New Printing Profile` : `Edit Printing Profile ${printingProfile.name}`}</h2>

      <Col md="8" className="d-flex flex-column p-3  bg-white">
        <form>
          <FormGroup>
            <div className="d-flex flex-column mb-3">
              <label htmlFor="name">Name</label>
              <InputText
                id="name"
                value={printingProfile?.name || ''}
                onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                required
              />
            </div>

            <div className="d-flex flex-column mb-3 gap-3 justify-content-between">
              <div className="d-flex flex-column mb-3 mt-3">
                <label htmlFor="profiles" className="font-bold">
                  Selected Printers
                </label>
                {printersList
                  ?.filter(printer => printingProfile?.printers?.some(selectedPrinter => selectedPrinter.id === printer.id))
                  .map(printer => (
                    <div key={printer.id} className={"d-flex gap-2"}>
                      <Checkbox
                        checked={printingProfile.printers?.some(selectedPrinter => selectedPrinter.id === printer.id)}
                        onChange={() => togglePrinterSelection(printer.id)}
                      />
                      <label className="font-bold">{printer.name}</label>
                    </div>
                  ))}
              </div>

              <div className="d-flex flex-column mb-3 mt-3 gap-2">
                <label htmlFor="profiles" className="font-bold">
                  Other Printers
                </label>
                {printersList
                  ?.filter(printer => !printingProfile.printers?.some(selectedPrinter => selectedPrinter.id === printer.id))
                  .map(printer => (
                    <div key={printer.id} className="d-flex flex-col gap-3">
                      <Checkbox checked={false} onChange={() => togglePrinterSelection(printer.id)} />
                      <label className="font-bold">{printer.name}</label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="d-flex flex-column mb-3">
              <label htmlFor="accountingId">Branches</label>
              <Select
                value={printingProfile.branch || null}
                options={branchList}
                getOptionLabel={(option: IBranch) => option.name}
                getOptionValue={(option: IBranch) => option.id}
                required
                onChange={(selectedBranch: IBranch) => dispatch(changeEntityField({ name: 'branch', value: selectedBranch }))}
              />
            </div>

            <div className="d-flex justify-content-start align-items-center  mt-7">
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
              &nbsp;
            </div>
          </FormGroup>
        </form>
      </Col>
    </Row>
  );
};

export default PrintingProfileUpdate;
