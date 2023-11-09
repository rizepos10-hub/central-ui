import React, { useState } from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Input, Label, Col, Row, Table} from 'reactstrap';
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";
import {Checkbox} from "primereact/checkbox";
import './required-option.css';
import CustomCreatableSelect from "app/entities/pizza-group/custome-select";
import Select from "react-select";

interface NewRequiredOption {
  affectOtherOption: boolean;
  name: string;
  desc: string;
  order: number | null;
  modifiers: Modifier[];
  definitionType: string;
  dependsOn: [];
}

interface Modifier {
  label: string;
  price: number;
}

interface NewRequiredOptionModalProps {
  showOptionInputs?: boolean;
  onClose: () => void;
  onSave: (newOption: NewRequiredOption) => void;
  name?: string | null;
  description?: string | null;
  options?: any[] | null;

}

const NewRequiredOptionInputs: React.FC<NewRequiredOptionModalProps> = ({ showOptionInputs, onClose, onSave,name,description,options }) => {
  const [newOption, setNewOption] = useState<NewRequiredOption>({
    affectOtherOption: false,
    name: '',
    desc: '',
    order: null,
    definitionType: "Base",
    modifiers: [],
    dependsOn: [],

  });

  const [newModifier, setNewModifier] = useState<Modifier>({
    label: '',
    price: 0,
  });
  const [selectedOption, setSelectedOption] = useState('Option 1');
  const [showPricesModal, setShowPricesModal] = useState(false);



  const handleSave = () => {
    onSave(newOption);
    onClose();
    setNewOption({
      affectOtherOption: false,
      name: '',
      desc: '',
      order: null,
      definitionType: "Base",
      modifiers: [],
      dependsOn: [],

    });
  };

  const handleAddModifier = () => {
    setNewOption((prevOption) => ({
      ...prevOption,
      modifiers: [...prevOption.modifiers, newModifier],
    }));
    setNewModifier({
      label: '',
      price: 0,
    });
    setShowPricesModal(false);

  };


  const handleOpenPricesModal = () => {
    setShowPricesModal(true);
  };

  const handleClosePricesModal = () => {
    setShowPricesModal(false);
  };

  return (
    <>
      <Col md="12">
      <div className="d-flex flex-column gap-2">
        <Row>
          <Col md={"3"}>
        <div contentEditable  suppressContentEditableWarning={true} className="option-name"
             onBlur={(e) => setNewOption({ ...newOption, name: e.currentTarget.innerText })}>
          default option name
        </div>
            <span contentEditable className="subtitle">default option desc</span>
          </Col>
          <Col md="6" className="d-flex flex-row gap-5">
         <CustomCreatableSelect selectedOption={selectedOption} setSelectedOption={setSelectedOption} OptionProps={options} />
            <div>
              <Button severity="help" onClick={handleOpenPricesModal}>
                Set Prices
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      <div className="d-flex my-3 gap-1">
        <Modal isOpen={showPricesModal} toggle={handleClosePricesModal}>
          <ModalHeader toggle={handleClosePricesModal}>Set Prices</ModalHeader>
          <ModalBody>
            <div>
              <Label for="defaultPrice">Default Price:</Label>
              <InputNumber
                id="defaultPrice"
                value={newModifier.price}
                onChange={(e) => setNewModifier({ ...newModifier, price: e.value })}
              />
            </div>
            <Table>
              <thead>
              <tr>
                <th>Modifier Label</th>
                <th>Price</th>
              </tr>
              </thead>
              <tbody>
              {newOption.modifiers.map((modifier, index) => (
                <tr key={index}>
                  <td>{modifier.label}</td>
                  <td>{modifier.price}</td>
                </tr>
              ))}
              </tbody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={handleClosePricesModal}>
              Close
            </Button>
            <Button color="primary" onClick={handleAddModifier}>
              Add Modifier
            </Button>
          </ModalFooter>
        </Modal>
          <Col md={"3"} className="d-flex flex-row mt-3">
        <Label for="type">Affect Other Option:</Label>
        <Checkbox
          id="affectOtherOption"
          checked={newOption.affectOtherOption}
          onChange={(e) => setNewOption({...newOption, affectOtherOption: e.target.checked})}/>
          </Col>
            <Col md={"5"} className=" mt-3" >
                <Select options={[]} />
            </Col>
      </div>

      </Col>
      <div className="d-flex justify-content-start">
    <Button color="primary" onClick={handleSave}>
      Save
    </Button>
      </div>
    </>
  );
};

export default NewRequiredOptionInputs;



{/* <div className="select-container"> */}
{/*   <div */}
{/*     className="select-option" */}
{/*     tabIndex={0} */}
{/*     onClick={() => setOptionsOpen((prev) => !prev)} */}
{/*   > */}
{/*     default select */}

{/*   </div> */}
{/*   <div className="options-container" style={{ display: isOptionsOpen ? 'block' : 'none' }}> */}
{/*     <div> */}
{/*       <div */}
{/*         className="option" */}
{/*         tabIndex={0} */}
{/*         style={{ backgroundColor: selectedOption === 'BBQ Sauce' ? '#fac140' : '#fff' }} */}
{/*         onClick={() => { */}
{/*           setSelectedOption('BBQ Sauce'); */}
{/*         }} */}
{/*       > */}
{/*         default option select 1 */}
{/*       </div> */}
{/*       <div */}
{/*         tabIndex={0} */}
{/*         className="option" */}
{/*         style={{ backgroundColor: selectedOption === 'Pizza Sauce' ? '#fac140' : '#fff' }} */}
{/*         onClick={() => { */}
{/*           setSelectedOption('Pizza Sauce'); */}
{/*         }} */}
{/*       > */}
{/*         default option select 2 */}
{/*       </div> */}
{/*     </div> */}
{/*   </div> */}
{/* </div> */}
