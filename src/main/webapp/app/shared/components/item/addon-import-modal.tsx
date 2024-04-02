import React, { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { getSortState, Translate, ValidatedForm } from 'react-jhipster';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FilterMatchMode } from 'primereact/api';
import { Link } from 'react-router-dom';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import Select from 'react-select';
import { IItem } from 'app/shared/model/ITEM/item.model';

interface IAddonImportProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (item: IItem) => void;
  itemOptions: { value: string; label: string }[];
}

const AddonImportModal = (props: IAddonImportProps) => {
  const [selectedItemToImport, setSelectedItemToImport] = useState({});
  const itemImportId = '';

  const handleSaveImportAddons = () => {
    props.handleSave(selectedItemToImport);

    props.handleClose();
  };

  const handleItemImportChange = selectedItem => {
    // itemImportId = selectedItemToImport.name
    setSelectedItemToImport(selectedItem);
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" size="xl" autoFocus={false}>
        <ModalBody>
          <div className="col md-6">
            <h2>
              <Translate contentKey="items.update.importAddonsModal.title"></Translate>
            </h2>
            <h4>
              <Translate contentKey="items.update.importAddonsModal.search"></Translate>
            </h4>
            <Select
              isMulti={false}
              onChange={handleItemImportChange}
              options={props.itemOptions}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
            />
          </div>

          <ModalFooter>
            <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>{' '}
            <Button color="primary" onClick={handleSaveImportAddons}>
              <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </>
  );
};

export default AddonImportModal;
