import React, {useEffect, useReducer, useState} from 'react';
import { Dialog } from 'primereact/dialog';
// import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {Modal, Button, ModalBody, ModalFooter, ModalHeader, Alert} from 'reactstrap';
import {createEntity, getEntity, reset, updateEntity} from "app/entities/settings/taxes/tax.reducer";
import {getEntities as getDiscounts} from "app/entities/discount/discount.reducer";
import {getEntities as getItems} from "app/entities/item/restaurant/regular-item/item.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";


const initialState = {
  id: null,
  code: '',
  description: '',
  value: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };

    case 'SET_VALUE':
      return { ...state, value: action.payload };

    case 'SET_ID':
      return { ...state, id: action.payload };
    default:
      return state;
  }
};
const AddTaxModal = ({ visible, onHide, taxId= null }) => {

  const [state, dispatch] = useReducer(reducer, initialState);
  const isNew = taxId === null;

  const dispatchAction = useAppDispatch()

  const [next, setNext] = useState(false);

  const taxEntity = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);

  console.log(taxEntity, 'lolo')

  const handleInputChange = (field, value) => {
    dispatch({ type: `SET_${field}`, payload: value });
  };

  const handleNextClick = () => {
    if (state.code && state.description && state.value) {
      setNext(true);
    } else {
      alert("Please fill in all required fields (Code, Description, Value) before proceeding.");
    }
  };

  const handleSubmit = () => {
    console.log(state, 'meso')
    if (state.code && state.description && state.value) {
      if (isNew) {
        dispatchAction(createEntity(state));
      } else {
        dispatchAction(updateEntity( state));
      }

      onHide();
    } else {
      alert('Please fill in all required fields (Code, Description, value) before submitting.');
    }
  };
  const handleClose = () => {
    setNext(false);
    onHide();
  };

  useEffect(() => {

    if (taxId !== null) {
      dispatchAction(getEntity(taxId));
    }
  }, []);

  useEffect(() => {
    if (taxEntity && taxId !== null) {
      dispatch({ type: 'SET_CODE', payload: taxEntity.code });
      dispatch({ type: 'SET_DESCRIPTION', payload: taxEntity.description });
      dispatch({ type: 'SET_VALUE', payload: taxEntity.value });
      dispatch({ type: 'SET_ID', payload: taxEntity.id });
    }

  }, [taxEntity.code]);


  return (
    <Modal isOpen={visible} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <h2>Add a New Tax</h2>
        <hr className="black" />
      </ModalHeader>
      {!next ? (
        <ModalBody>

          <p>Code, description, and value are required. Note that you cannot delete a tax after adding it.</p>
          <div className="grid">
            <div className="col-12 d-flex flex-column mb-2">
              <span style={{ fontWeight: 'bold' }}>Code</span>
              <InputText placeholder="Enter code"
                         value={state.code}
                         readOnly={!isNew}
                         onChange={(e) => handleInputChange('CODE', e.target.value)}
              />
              <p>You cannot edit the code after saving</p>
            </div>
            <div className="col-12 d-flex flex-column mb-2">
              <span style={{ fontWeight: 'bold' }}>Description</span>
              <InputText
                placeholder="Enter description"
                value={state.description}
                onChange={(e) => handleInputChange('DESCRIPTION', e.target.value)}
              />
            </div>
            {/* <div className="col-12 d-flex flex-column mb-2"> */}
            {/*   <div className="d-flex justify-content-between"> */}
            {/*     <span style={{ fontWeight: 'bold' }}>Accounting reference</span> */}
            {/*     <span className="font-bold">Optional</span> */}
            {/*   </div> */}
            {/*   <InputText */}
            {/*     placeholder="Enter accounting reference" */}
            {/*     value={state.accountingReference} */}
            {/*     onChange={(e) => handleInputChange('ACCOUNTING_REFERENCE', e.target.value)} */}
            {/*   /> */}
            {/*   <p>Used for accounting integrations such as POS Accounting</p> */}
            {/* </div> */}
            <div className="col-12 d-flex flex-column mb-2">
              <span style={{ fontWeight: 'bold' }}>Value (%)</span>
              <InputText placeholder="Enter value"
                         value={state.value}
                         onChange={(e) => handleInputChange('VALUE', e.target.value)}
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
              <span className="ml-auto">{state.code}</span>
            </div>
            <hr className="border-dark" />
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Description</span>
              <span className="ml-auto">{state.description}</span>
            </div>
            <hr className="border-dark" />
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Accounting reference</span>
              <span className="ml-auto">{state.accountingReference}</span>
            </div>
            <hr className="border-dark" />
            <div className="col-6 d-flex mb-2 align-items-center">
              <span className="font-bold text-xl">Value (%)</span>
              <span className="ml-auto  ">{state.value}</span>
            </div>
          </>
        </ModalBody>


      )}
      <ModalFooter>
        {next && <div className="d-flex flex-start flex-auto"><Button className="flex-start" color="secondary" onClick={() => setNext(false)}>Back</Button></div>}
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
            <Button color="primary" onClick={!next ? handleNextClick : handleSubmit}>
              {next ? 'Submit' : "Next"}
            </Button>
      </ModalFooter>

    </Modal>
  );
};

export default AddTaxModal;
