import React, { useState } from 'react';
import {Modal, Button, Input, Label, ModalFooter, ModalBody, ModalHeader, Col, Row} from 'reactstrap';
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";

interface OptionalOption {
  id: string;
  name: string;
  desc: string;
  order: number;
  notCalculated: boolean;
  selected: boolean;
  dependsOn: string[];
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  price: number;
  modifierTypeValue: { [key: string]: string };
}

interface NewOptionalOptionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSave: (newOption: OptionalOption) => void;
}

const NewOptionalOptionModal: React.FC<NewOptionalOptionModalProps> = ({ showModal, onClose, onSave }) => {
  const [newOption, setNewOption] = useState<OptionalOption>({
    id: '',
    name: '',
    desc: '',
    order: 1,
    notCalculated: false,
    selected: false,
    dependsOn: [],
    modifiers: [],
  });

  const [newModifier, setNewModifier] = useState<Modifier>({
    id: '',
    price: 0,
    modifierTypeValue: {},
  });

  const handleSave = () => {
    onSave(newOption);
    onClose();
    setNewOption({
      id: '',
      name: '',
      desc: '',
      order: 1,
      notCalculated: false,
      selected: false,
      dependsOn: [],
      modifiers: [],
    });
  };

  const handleAddModifier = () => {
    setNewOption((prevOption) => ({
      ...prevOption,
      modifiers: [...prevOption.modifiers, newModifier],
    }));
    setNewModifier({
      id: '',
      price: 0,
      modifierTypeValue: {},
    });
  };

  return (
    <Modal isOpen={showModal} toggle={onClose}>
      <ModalHeader toggle={onClose}>Add New Optional Option</ModalHeader>
      <ModalBody>
        <div className="d-flex flex-column">
            <Label for="name">Name:</Label>
            <InputText
              id="name"
              name="name"
              value={newOption.name}
              onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
            />
            </div>
            <div className="d-flex flex-column mt-3">
            <Label for="desc">Description:</Label>
            <InputText
              id="desc"
              value={newOption.desc}
              onChange={(e) => setNewOption({ ...newOption, desc: e.target.value })}
            />
            </div>
        <div className="d-flex flex-column mt-3">

            <Label for="order">Order:</Label>
            <InputNumber
              id="order"
              value={newOption.order}
              onChange={(e: any) => setNewOption({ ...newOption, order: parseInt(e.target.value, 10) })}
            />
        </div>
        <div className="d-flex flex-column mt-3">

        <Label for="modifiers">Modifiers:</Label>
        {newOption.modifiers.map((modifier, index) => (
          <Row key={index}>
              <InputText
                value={modifier.id}
                onChange={(e) =>
                  setNewOption((prevOption) => {
                    const modifiers = [...prevOption.modifiers];
                    modifiers[index] = { ...modifiers[index], id: e.target.value };
                    return { ...prevOption, modifiers };
                  })
                }
              />

              <InputNumber
                value={modifier.price}
                onChange={(e: any) =>
                  setNewOption((prevOption) => {
                    const modifiers = [...prevOption.modifiers];
                    modifiers[index] = { ...modifiers[index], price: parseFloat(e.target.value) };
                    return { ...prevOption, modifiers };
                  })
                }
              />
          </Row>
        ))}
        </div>
        <div className="d-flex flex-column mt-3">

            <InputText
              placeholder="Modifier ID"
              value={newModifier.id}
              onChange={(e) => setNewModifier({ ...newModifier, id: e.target.value })}
            />
        </div>
        <div className="d-flex flex-column mt-3 gap-3">

            <InputNumber
              placeholder="Modifier Price"
              value={newModifier.price}
              onChange={(e: any) => setNewModifier({ ...newModifier, price: parseFloat(e.target.value) })}
            />

        <Button onClick={handleAddModifier}>Add Modifier</Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Close
        </Button>
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NewOptionalOptionModal;
