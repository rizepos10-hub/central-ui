import React, { useEffect, useReducer, useRef, useState } from "react";
import { Dialog } from 'primereact/dialog';
// import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {Modal, Button, ModalBody, ModalFooter, ModalHeader, Alert} from 'reactstrap';
import {createEntity, getEntity, resetEntity, updateEntity, changeEntityField} from "app/entities/settings/tax/tax.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import { ITax } from "app/shared/model/TAX/tax.model";
import { InputNumber } from "primereact/inputnumber";



const AddTaxModal = ({ visible, onHide, taxId= null }) => {

  const isNew = taxId === null;
  const dispatch = useAppDispatch()
  const [next, setNext] = useState(false);


  const taxEntity :ITax = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);


  const handleChange = <K extends keyof ITax>(fieldName: K, value: ITax[K]) => {
    dispatch(changeEntityField({ fieldName, value }));
  };

 const allFieldsFilled =  taxEntity.code &&  taxEntity.description && taxEntity.value;

  const handleClose = () => {
    setNext(false);
    onHide();
  };

  const handleNextClick = () => {
    if (allFieldsFilled) {
      setNext(true);
    } else {
      alert("Please fill in all required fields (Code, Description, Value) before proceeding.");
    }
  };


  const handleSubmit = () => {
    const entity :ITax = {
     ...taxEntity
    }
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }

    onHide();
  };

  const fetchTaxEntity = () => {
    if (!isNew && taxId !== null) {
      dispatch(getEntity(taxId));
    }
  };

  useEffect(() => {
    fetchTaxEntity();


  }, [taxId]);



  return (
    <Modal isOpen={visible} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        Add a New Tax
        <hr className="black" />
      </ModalHeader>
      {!next ? (
        <ModalBody>

          <p>Code, description, and value are required. Note that you cannot delete a tax after adding it.</p>
          <div className="grid">
            <div className="col-12 d-flex flex-column mb-2">
              <span className={"fw-bold"}>Code</span>
              <InputText
                placeholder="Enter code"
                value={taxEntity.code || ''}
                readOnly={!isNew}
                onChange={(e) => handleChange('code', e.target.value)}
              />
              <p>You cannot edit the code after saving</p>
            </div>
            <div className="col-12 d-flex flex-column mb-2">
              <span className={"fw-bold"}>Description</span>
              <InputText
                placeholder="Enter description"
                value={taxEntity.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="col-12 d-flex flex-column mb-2">
              <span className={"fw-bold"}>Value (%)</span>
              <InputNumber
                placeholder="Enter value"
                value={taxEntity.value || null}
                onChange={(e) => handleChange('value', e.value)}
              />
            </div>
          </div>
        </ModalBody>
      ) : (
        <ModalBody>
          <Alert color="warning">
            You cannot delete a tax after adding it.
          </Alert>
          <>
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Code</span>
              <span className="ml-auto">{taxEntity.code}</span>
            </div>
            <hr className="border-dark" />
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Description</span>
              <span className="ml-auto">{taxEntity.description}</span>
            </div>
            <hr className="border-dark" />

            <hr className="border-dark" />
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Value (%)</span>
              <span className="ml-auto  ">{taxEntity.value}</span>
            </div>
          </>
        </ModalBody>


      )}
      <ModalFooter>
        {next && <div className="d-flex flex-start flex-auto"><Button className="flex-start" color="secondary" onClick={() => setNext(false)}>Back</Button></div>}
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
            <Button color="primary" disabled={updating} onClick={!next ? handleNextClick : handleSubmit}>
              {next ? 'Submit' : "Next"}
            </Button>
      </ModalFooter>

    </Modal>
  );
};

export default AddTaxModal;
