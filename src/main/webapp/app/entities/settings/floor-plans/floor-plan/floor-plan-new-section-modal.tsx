import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import Attachment from 'app/shared/components/attachment/attachment';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import {Translate} from "react-jhipster";

const SectionModal = ({ isOpen, onClose, onAddSection, initialDimensions}) => {
  console.log(initialDimensions, 'initialDimensions')
  const [newSection, setNewSection] = useState({
    name: '',
    dimensions: {
     ...initialDimensions
    },
    visible: false,
    backgroundImage: null,
  });

  const removeImage = () => {
    setNewSection((prev) => ({
      ...prev,
      backgroundImage: null,
    }));
  };

  const addImage = (imageInfo) => {
    setNewSection((prev) => ({
      ...prev,
      backgroundImage: imageInfo,
    }));
  };

  const handleAddSection = () => {
    if (newSection.name.trim() === '') {
      alert('Please enter section name');
      return;
    }
    onAddSection(newSection);
    setNewSection({
      name: '',
      dimensions: {
        width: null,
        height: null,
      },
      visible: false,
      backgroundImage: null,
    });
  };

  return (
    <Modal isOpen={isOpen} contentlabel="Tables Modal">
      <ModalHeader toggle={onClose}>Add New Section</ModalHeader>
      <ModalBody>
        <ModalBody>
          <div className="d-flex flex-column" style={{minWidth: "50%"}}>
            <div className={"d-flex flex-column w-75"}>
              <div className={"d-flex flex-column justify-content-between"}>
                <label  className={"mt-5"}>
                  Section Name
                </label>
                <InputText
                  type="text"
                  name="name"
                  required={true}
                  id="floor-plan-name"
                  value={newSection?.name || ''}
                  onChange={(e) =>
                    setNewSection((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))}
                />
              </div>
              <div className={"d-flex flex-column justify-content-between mt-5"}>
                <label>
                  Dimensions
                </label>
                <div className={"d-flex gap-4"}>
                  <InputNumber
                    size={12}
                    placeholder={"Width"}
                    maxFractionDigits={2}
                    className={"mb-5 "}
                    name="dimension-width"
                    required={true}
                    value={newSection?.dimensions?.width || null}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        dimensions: {
                          ...prev?.dimensions,
                          width: e.value,
                        },
                      }))
                    }
                  />
                  <InputNumber
                    placeholder={"Height"}
                    size={12}
                    className={"mb-5 "}
                    maxFractionDigits={2}
                    required={true}
                    value={newSection?.dimensions?.height || null}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        dimensions: {
                          ...prev?.dimensions,
                          height: e.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className={"d-flex flex-column"}>
                <label  className={"mt-2"}>
                  <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                </label>
                <Attachment
                  image={newSection?.backgroundImage}
                  onRemoveImage={removeImage}
                  onAddImage={addImage}
                />
              </div>
              <div className={"d-flex flex-column"}>
                <label className={"mt-2"}>
                  Visible
                </label>
                <div className={"mt-1"}>
                  <Checkbox
                    checked={newSection?.visible}
                    className={"mt-1"}
                    onChange={(e) =>
                      setNewSection((prev) => ({
                        ...prev,
                        visible: e.checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalBody>
      <ModalFooter>
        <Button label="Add" onClick={handleAddSection} />
      </ModalFooter>
    </Modal>
  );
};

export default SectionModal;
