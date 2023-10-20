import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  FormText,
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  CardFooter,
  DropdownItem,
  DropdownToggle,
  Dropdown, DropdownMenu, Popover, PopoverBody, ListGroupItem, ListGroup
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPrintingProfile } from 'app/shared/model/printing-profile.model';
import { getEntity, updateEntity, createEntity, reset } from './printing-profile.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getPrinters } from 'app/entities/settings/printing/printer/printer.reducer';

import Select from "react-select";
import { Calendar } from 'primereact/calendar';
import {InputText} from "primereact/inputtext";
import {Translate} from "react-jhipster";
import {Checkbox} from "primereact/checkbox";

export const PrintingProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printersList = useAppSelector(state => state.printer.entities)
  const branchList = useAppSelector(state => state.branch.entities).map((branch) => ({label: branch.name, value: branch.id}));

  const printingProfileEntity = useAppSelector(state => state.printingProfiles.entity);
  const loading = useAppSelector(state => state.printingProfiles.loading);
  const updating = useAppSelector(state => state.printingProfiles.updating);
  const updateSuccess = useAppSelector(state => state.printingProfiles.updateSuccess)



console.log(updateSuccess, 'updateSuccess')

  const [printingProfileState, setPrintingProfileState] :any= useState({
    name: '',
    printers: [],
    branch: null ,
  });



  console.log(printingProfileState?.branch, 'printingProfileState?.branch')



  const handleClose = () => {
    navigate(`/printing-profiles`);
  };






  console.log(printersList, 'printersList')
  console.log(printingProfileEntity, 'Profile printersList')

  const handleSubmit = () => {

    console.log(printingProfileState.printers, 'sl')
    const formData = {
      id: id ? id : null,
      name: printingProfileState.name,
      branch: {id : printingProfileState.branch.id},
      printers: printingProfileState.printers
    };
    if(isNew){

    dispatch(createEntity(formData));

    }else{

    dispatch(updateEntity(formData))

    }

  };







  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getPrinters({}))
    dispatch(getBranches({}))
  }, []);




  useEffect(() => {
    if (updateSuccess) {
      console.log("hellllllllo")
      handleClose();
    }
    if (printingProfileEntity) {
      setPrintingProfileState((prev) => ({
        ...prev,
        name: printingProfileEntity.name
      }));

      setPrintingProfileState((prev) => ({
        ...prev,
        branch: {label : printingProfileEntity?.branch?.name, value: printingProfileEntity?.branch?.id, id: printingProfileEntity?.branch?.id}
      }));

      setPrintingProfileState((prev) => ({
        ...prev,
        printers: printingProfileEntity?.printers?.map((printer) => ({label : printer?.name, value: printer?.id, id: printer?.id}))
      }));
    }
  }, [printingProfileEntity,updateSuccess]);



  const togglePrinterSelection = (printerId) => {
    setPrintingProfileState((prev) => {
      const updatedPrinters = [...(prev?.printers || [])];
      const printerIndex = updatedPrinters?.findIndex((printer) => printer.id === printerId);

      if (printerIndex !== -1) {
        updatedPrinters.splice(printerIndex, 1);
      } else {
        const selectedPrinter = printersList?.find((printer) => printer.id === printerId);
        if (selectedPrinter) {
          updatedPrinters?.push({id: selectedPrinter.id, label: selectedPrinter.name, value: selectedPrinter.id});
        }
      }

      return {...prev, printers: updatedPrinters};
    });
  }

  return (

    <Row>
      <h2>{isNew ? `Add New Printing Profile` : `Edit Printing Profile ${printingProfileEntity.name}` }</h2>


        <Col md="8"  className="d-flex flex-column p-3  bg-white">

          <FormGroup>
            <div className="d-flex flex-column mb-3">
              <label htmlFor="name">Name</label>
              <InputText id="name" value={printingProfileState.name} onChange={(e) => {
                setPrintingProfileState(prev => ({...prev, name: e.target.value }))
              }} />
            </div>

            <div className="d-flex flex-column mb-3 gap-3 justify-content-between">

              <div className="d-flex flex-column mb-3 mt-3">
                <label htmlFor="profiles" className="font-bold">Selected Printers</label>
                {printersList?.filter((printer) => printingProfileState.printers?.some((selectedPrinter) => selectedPrinter.id === printer.id))
                  .map((printer) => (
                  <div key={printer.id}>
                    <Checkbox
                      checked={printingProfileState.printers?.some((selectedPrinter) => selectedPrinter.id === printer.id)}
                      onChange={() => togglePrinterSelection(printer.id)}
                    />
                    <label className="font-bold">{printer.name}</label>

                  </div>
                ))}
              </div>

              <div className="d-flex flex-column mb-3 mt-3">
                <label htmlFor="profiles" className="font-bold">Other Printers</label>
                {printersList?.filter((printer) => !printingProfileState.printers?.some((selectedPrinter) => selectedPrinter.id === printer.id))
                  .map((printer) => (
                    <div key={printer.id} className="d-flex flex-col gap-3">
                        <Checkbox
                          checked={false}
                          onChange={() => togglePrinterSelection(printer.id)}
                        />
                      <label className="font-bold">{printer.name}</label>

                    </div>
                  ))}
              </div>
            </div>

            <div className="d-flex flex-column mb-3">


              <label htmlFor="accountingId">Branches</label>
              <Select value={printingProfileState.branch} options={branchList}
                      onChange={(e) => {
                        console.log(e, 'loggg')
                        setPrintingProfileState(prev => ({...prev, branch: {label:e.label, value: e.value, id: e.value}}))
                      }}  />

            </div>


          </FormGroup>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">

          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/printing-profiles" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>
          &nbsp;
          <Button color="primary" onClick={handleSubmit}>
            Save
          </Button>
          &nbsp;

        </div>
    </Row>
  );
};

export default PrintingProfileUpdate;

