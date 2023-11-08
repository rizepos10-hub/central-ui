import React, { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Input, Label } from 'reactstrap';
import {InputText} from "primereact/inputtext";
import {InputNumber} from "primereact/inputnumber";

interface NewRequiredOption {
  name: string;
  desc: string;
  modifiers: Modifier[];
}

interface Modifier {
  label: string;
  price: number;
  modifierTypeValue: any[];
}

interface NewRequiredOptionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSave: (newOption: NewRequiredOption) => void;
}

const NewRequiredOptionModal: React.FC<NewRequiredOptionModalProps> = ({ showModal, onClose, onSave }) => {
  const [newOption, setNewOption] = useState<NewRequiredOption>({
    name: '',
    desc: '',
    modifiers: [],
  });

  const [newModifier, setNewModifier] = useState<Modifier>({
    label: '',
    price: 0,
    modifierTypeValue: [],
  });

  const handleSave = () => {
    onSave(newOption);
    onClose();
    setNewOption({
      name: '',
      desc: '',
      modifiers: [],
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
      modifierTypeValue: [],
    });
  };

  return (
    <Modal isOpen={showModal} toggle={onClose}>
      <ModalHeader toggle={onClose}>Add New Required Option</ModalHeader>
      <ModalBody>
        <div className="d-flex flex-column">

        <Label for="name">Name:</Label>
        <InputText
          id="name"
          value={newOption.name}
          onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
        />
        </div>
        <div className="d-flex flex-column">
        <Label for="desc">Description:</Label>
        <InputText
          type="text"
          id="desc"
          value={newOption.desc}
          onChange={(e) => setNewOption({ ...newOption, desc: e.target.value })}
        />
        </div>

        <Label for="modifiers">Modifiers:</Label>
        {newOption.modifiers.map((modifier, index) => (
          <div key={index}>
            <InputText
              value={modifier.label}
              onChange={(e) =>
                setNewOption((prevOption) => {
                  const modifiers = [...prevOption.modifiers];
                  modifiers[index] = { ...modifiers[index], label: e.target.value };
                  return { ...prevOption, modifiers };
                })
              }
            />
            <InputNumber
              value={modifier.price}
              onChange={(e:any) =>
                setNewOption((prevOption) => {
                  const modifiers = [...prevOption.modifiers];
                  modifiers[index] = { ...modifiers[index], price: parseFloat(e.target.value) };
                  return { ...prevOption, modifiers };
                })
              }
            />
          </div>
        ))}

        <InputText
          placeholder="Modifier Label"
          value={newModifier.label}
          onChange={(e) => setNewModifier({ ...newModifier, label: e.target.value })}
        />
        <InputNumber
          placeholder="Modifier Price"
          value={newModifier.price}
          onChange={(e :any) => setNewModifier({ ...newModifier, price: parseFloat(e.target.value) })}
        />
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

export default NewRequiredOptionModal;
