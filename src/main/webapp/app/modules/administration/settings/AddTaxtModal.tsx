import React, {useReducer, useState} from 'react';
import { Dialog } from 'primereact/dialog';
// import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {Modal, Button, ModalBody, ModalFooter, ModalHeader, Alert} from 'reactstrap';


const initialState = {
  code: '',
  description: '',
  accountingReference: '',
  rate: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_ACCOUNTING_REFERENCE':
      return { ...state, accountingReference: action.payload };
    case 'SET_RATE':
      return { ...state, rate: action.payload };
    default:
      return state;
  }
};
const AddTaxModal = ({ visible, onHide }) => {

  const [state, dispatch] = useReducer(reducer, initialState);

  const [next, setNext] = useState(false);

  const handleInputChange = (field, value) => {
    dispatch({ type: `SET_${field}`, payload: value });
  };

  const handleNextClick = () => {
    if (state.code && state.description && state.rate) {
      setNext(true);
    } else {
      // You can show an error message or take other actions
      alert("Please fill in all required fields (Code, Description, Rate) before proceeding.");
    }
  };
  const handleClose = () => {
    setNext(false);
    onHide();
  };

  return (
    <Modal isOpen={visible} toggle={handleClose} size="lg">
      <ModalHeader toggle={handleClose}>
        <h2>Add a New Tax</h2>
        <hr className="black" />
      </ModalHeader>
      {!next ? (
        <ModalBody>

          <p>Code, description, and rate are required. Note that you cannot delete a tax after adding it.</p>
          <div className="grid">
            <div className="col-12 d-flex flex-column mb-2">
              <span style={{ fontWeight: 'bold' }}>Code</span>
              <InputText placeholder="Enter code"
                         value={state.code}
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
            <div className="col-12 d-flex flex-column mb-2">
              <div className="d-flex justify-content-between">
                <span style={{ fontWeight: 'bold' }}>Accounting reference</span>
                <span className="font-bold">Optional</span>
              </div>
              <InputText
                placeholder="Enter accounting reference"
                value={state.accountingReference}
                onChange={(e) => handleInputChange('ACCOUNTING_REFERENCE', e.target.value)}
              />
              <p>Used for accounting integrations such as POS Accounting</p>
            </div>
            <div className="col-12 d-flex flex-column mb-2">
              <span style={{ fontWeight: 'bold' }}>Rate (%)</span>
              <InputText placeholder="Enter rate"
                         value={state.rate}
                         onChange={(e) => handleInputChange('RATE', e.target.value)}
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
              <span className="font-bold text-xl">Rate (%)</span>
              <span className="ml-auto  ">{state.rate}</span>
            </div>
          </>
        </ModalBody>


      )}
      <ModalFooter>
          <Button className="flex-start" color="secondary" onClick={() => setNext(false)}>Back</Button>
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
            <Button color="primary" onClick={handleNextClick}>
              Next
            </Button>
      </ModalFooter>

    </Modal>
  );
};

export default AddTaxModal;
