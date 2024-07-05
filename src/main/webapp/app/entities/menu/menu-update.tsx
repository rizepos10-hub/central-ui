import React, { useEffect } from 'react'
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster'
import { Button, Modal, ModalBody, ModalHeader } from 'reactstrap'
import Select from 'react-select'
import { SelectButton } from 'primereact/selectbutton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAppDispatch, useAppSelector } from 'app/config/store'
import { IMenu } from 'app/shared/model/menu.model'
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";

const MenuUpdate = ({
    menuEntity,
    setIsModalOpen,
    isModalOpen,
    saveEntity,
    updating,
    selectedBranches,
    setSelectedBranches,
    selectedName,
    setSelectedName,
}: {
    menuEntity: IMenu;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isModalOpen: boolean;
    saveEntity: (values?: any) => void;
    updating: any;
    selectedBranches: any;
    setSelectedBranches: any;
    selectedName: string;
    setSelectedName: React.Dispatch<React.SetStateAction<string>>;
}) => {
    const dispatch = useAppDispatch();

    const ITEM_TYPE_OPTIONS = ["RETAIL", "RESTAURANT"];
    const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));

    useEffect(() => {
        dispatch(getBranches({}));
        if (menuEntity.name) {
            setSelectedName(menuEntity.name)
        }
    }, [])

    return (
        <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(prev => !prev)} className="modal-lg">
            <ModalHeader toggle={() => setIsModalOpen(prev => !prev)}>
                <Translate contentKey="menus.shared.update.edit.title">Edit Menu</Translate>
            </ModalHeader>
            <ModalBody>
                <ValidatedForm onSubmit={saveEntity}>
                    <ValidatedField
                        label={translate('menus.shared.update.name')}
                        id="menu-name"
                        name="name"
                        data-cy="name"
                        type="text"
                        validate={{
                            required: { value: true, message: translate('entity.validation.required') },
                            maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                        }}
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                    />
                    <div className="mb-3">
                        {translate('menus.shared.update.branches')}
                        <Select
                            onChange={(e) => setSelectedBranches({
                                label: e.label,
                                value: e.value
                            })}
                            options={branchList}
                            value={{
                                label: selectedBranches?.label,
                                value: selectedBranches?.value
                            }}
                            name='branch'
                            id='branch'
                            data-cy='branch'
                        />
                    </div>
                    <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => setIsModalOpen(prev => !prev)} replace='true' color="info">
                        <FontAwesomeIcon icon="arrow-left" />
                        &nbsp;
                        <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.back">Back</Translate>
                        </span>
                    </Button>
                    &nbsp;
                    <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                        <FontAwesomeIcon icon="save" />
                        &nbsp;
                        <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                </ValidatedForm>
            </ModalBody>
        </Modal>
    )
}

export default MenuUpdate