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

interface IAddonImportProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (itemId: string) => void;
  itemOptions: { value: string; label: string }[];
}

const AddonImportModal = (props: IAddonImportProps) => {
  const [selectedItemToImport, setSelectedItemToImport] = useState({ value: '' });
  const itemImportId = '';

  const handleSaveImportAddons =  () => {
    props.handleSave(selectedItemToImport.value);

    props.handleClose();
  };

  const handleItemImportChange = selectedItemToImport => {
    // itemImportId = selectedItemToImport.name
    setSelectedItemToImport(selectedItemToImport);
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" size="xl" autoFocus={false}>
        <ValidatedForm onSubmit={handleSaveImportAddons}>
          <ModalBody>
            <div className="col md-6">
              <h2>
                <Translate contentKey="tempApp.item.import-addon"></Translate>
              </h2>
              <h4>
                <Translate contentKey="tempApp.item.home.search"></Translate>
              </h4>
              <Select isMulti={false} onChange={handleItemImportChange} options={props.itemOptions} />
            </div>

            <ModalFooter>
              <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
                <Translate contentKey="entity.action.cancel">Cancel</Translate>
              </Button>{' '}
              <Button color="primary" type="submit" data-cy="submit">
                Import Addons
              </Button>
            </ModalFooter>
          </ModalBody>
        </ValidatedForm>
      </Modal>
    </>
  );
};

export default AddonImportModal;
