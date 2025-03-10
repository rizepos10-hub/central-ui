import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col } from 'reactstrap';
import { getSortState, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import { getEntity, updateEntity, createEntity, reset, deleteEntity, getEntities as categoryEntitiesTree, searchEntities as categorySearchEntitiesTree, changeEntityField } from './retail-item-category.reducer';

import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { uploadImage } from "app/entities/attachment/attachment.reducer";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ITerm } from "app/shared/model/term.model";
import { InputText } from "primereact/inputtext";

interface UpdateItemRetailCategoryTreeProps {
    categoryId?: string;
    categories?: [];
    onSave?: (load?) => void;
}

export const UpdateItemRetailCategoryTree: React.FC<UpdateItemRetailCategoryTreeProps> = ({ categoryId, onSave }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<'id'>();
    const isNew = (id === undefined && categoryId === undefined);
    const categories = useAppSelector(state => state.retailCategory.entities);
    const categoryEntity: ITerm = useAppSelector(state => state.retailCategory.entity);
    const loading = useAppSelector(state => state.retailCategory.loading);
    const updating = useAppSelector(state => state.retailCategory.updating);
    const updateSuccess = useAppSelector(state => state.retailCategory.updateSuccess);
    const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);
    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );

    useEffect(() => {
        if (isNew) {
            dispatch(reset());
        } else {
            const entityId = id || categoryId; // Use id from URL or categoryId prop
            if (entityId) {
                dispatch(getEntity(entityId)); // Fetch the entity details
            }
        }

        dispatch(getProfileGroups({
            page: paginationState.activePage - 1,
            size: paginationState.itemsPerPage,
            sort: `${paginationState.sort},${paginationState.order}`,
        }));

        dispatch(categoryEntitiesTree({
            page: paginationState.activePage - 1,
            size: paginationState.itemsPerPage,
            sort: `${paginationState.sort},${paginationState.order}`,
        }));
    }, [categoryId]);

    const handleProfileGroupsChange = (profileGroups) => {
        dispatch(changeEntityField({
            name: "accountingGroups",
            value: [profileGroups]
        }))
    };

    const handleParentsChange = selectedParent => {
        dispatch(changeEntityField({
            name: "parents",
            value: selectedParent ? [selectedParent] : []
        }))
    };

    const handleSearch = (inputValue) => {
        dispatch(categorySearchEntitiesTree({
            query: inputValue,
            page: paginationState.activePage - 1,
            size: paginationState.itemsPerPage,
            sort: `${paginationState.sort},${paginationState.order}`,
        })
        )
    };

    const saveEntity = (e, createNew = false) => {
        e.preventDefault();
        const entity = {
            ...categoryEntity,
        };

        if (isNew) {
            dispatch(createEntity(entity)).then((res) => {
                dispatch(reset());
                onSave()
            })
        } else {
            dispatch(updateEntity(entity)).then(() => {
                dispatch(reset());
                onSave()
            })
        }


    };

    const removeEntity = (e) => {
        e.preventDefault();
        const entity = {
            ...categoryEntity,
        };

        dispatch(deleteEntity(entity.id)).then(() => {
            dispatch(reset());
            onSave()
        })

    };

    const reject = () => {

    }

    const resetData = () => {
        dispatch(reset());
        onSave(false);
    }

    const confirmDelete = (e) => {
        e.preventDefault();
        confirmDialog({
            message: 'Do you want to delete this record?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: () => removeEntity(e),
            reject
        });
    };


    return (
        <div className='position-fixed w-50'>
            <Row >
                <Col md="8">
                    <h2 data-cy="TermCreateUpdateHeading" key={isNew ? 'create' : 'edit'}>
                        {isNew ? (
                            <Translate contentKey={'itemCategories.update.restaurant.create.title'} />
                        ) : (
                            <Translate contentKey={'itemCategories.update.restaurant.edit.title'} />
                        )}
                    </h2>
                </Col>
            </Row>
            <Row >
                <Col md="8" className="d-flex flex-column p-3  bg-white">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <form>
                            <div className="mb-3 d-flex flex-column">
                                <Translate contentKey="itemCategories.update.name">Name</Translate>
                                <InputText
                                    name={"name"}
                                    id={"category-name"}
                                    required
                                    value={categoryEntity.name || ''}
                                    onChange={e => dispatch(changeEntityField({ name: "name", value: e.target.value }))}
                                />
                            </div>

                            <div className="mb-3">
                                <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
                                <Select
                                    value={categoryEntity.accountingGroups || []}
                                    isClearable
                                    onChange={handleProfileGroupsChange}
                                    options={profileGroupsOptions}
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                />
                            </div>

                            <div className="mb-3">
                                <Translate contentKey="itemCategories.update.parents">Parents</Translate>
                                <Select
                                    value={categoryEntity?.parents || []}
                                    isClearable
                                    onChange={handleParentsChange}
                                    options={categories}
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                    onInputChange={handleSearch}
                                />
                            </div>
                            <div className="mb-3">
                                <MediaLibrary
                                    handleFilesSelectCallback={(files) => {
                                        const newAttachment = transformAttachmentStructure(files, 'toIAttachment')[0];
                                        dispatch(changeEntityField({
                                            name: 'attachments',
                                            value: newAttachment ? [newAttachment] : []
                                        }));
                                    }}
                                    defaultValues={transformAttachmentStructure(categoryEntity?.attachments || [], 'toFileLibraryListItem')}
                                />
                            </div>


                            <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => resetData()} color="info">
                                <span className="d-none d-md-inline">
                                    <Translate contentKey="entity.action.reset">Reset</Translate>
                                </span>
                            </Button>
                            &nbsp;
                            <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                                <FontAwesomeIcon icon="save" />
                                &nbsp;
                                <Translate contentKey="entity.action.save">Save</Translate>
                            </Button>
                            &nbsp;
                            {
                                !isNew && <Button onClick={confirmDelete} color="danger" id="Delete-entity" data-cy="entityDeleteButton" type="submit" disabled={updating}>
                                    <FontAwesomeIcon icon="trash" />
                                    &nbsp;
                                    <Translate contentKey="entity.action.delete">Delete</Translate>
                                </Button>
                            }
                        </form>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default UpdateItemRetailCategoryTree;
