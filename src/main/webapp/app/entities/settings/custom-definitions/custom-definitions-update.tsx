import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset, getEntities } from './custom-definitions.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { CustomDefinitionType, ICustomDefinition } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition.model';
import { Checkbox } from 'primereact/checkbox';

export const CustomDefinitionsUpdate = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { id } = useParams<'id'>();
    const isNew = id === undefined;

    const customDefinition: ICustomDefinition = useAppSelector(state => state.customDefinitions.entity);
    const loading = useAppSelector(state => state.customDefinitions.loading);
    const updating = useAppSelector(state => state.customDefinitions.updating);

    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );

    const handleClose = () => {
        navigate(-1);
    };



    useEffect(() => {
        if (isNew) {
            dispatch(reset());
        } else {
            dispatch(getEntity(id));
        }
        dispatch(
            getEntities({
                page: paginationState.activePage - 1,
                size: paginationState.itemsPerPage,
                sort: `${paginationState.sort},${paginationState.order}`,
            })
        );
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        dispatch(changeEntityField({ name, value }))
    };

    const saveEntity = (e, createNew = false) => {
        e?.preventDefault();
        const entity = {
            ...customDefinition,
        };

        if (isNew) {
            dispatch(createEntity(entity)).then((res) => {
                if (createNew) {
                    dispatch(reset());
                } else {
                    const payload = res?.payload as any;
                    const newId = payload?.data?.id;

                    // @ts-expect-error -- unknown type
                    if (!res?.error) {
                        navigate(`/custom-definitions/${newId}/edit`)
                    }
                }
            })
        } else {
            dispatch(updateEntity(entity)).then(() => {
                if (createNew) {
                    navigate(`/custom-definitions/new`)
                }
            })
        }
    };

    const options = Object.values(CustomDefinitionType).map((value) => ({
        value,
        label: value,
    }));


    return (
        <div>
            <Row>
                <Col md="12">
                    <h2 id="tempApp.customDefinition.home.createOrEditLabel">
                        {isNew ? (
                            <Translate contentKey={'customDefinition.update.create.title'}>Create New custom Definition</Translate>
                        ) : (
                            <Translate contentKey={'customDefinition.update.edit.title'}>Edit custom Definition Group</Translate>
                        )}
                    </h2>
                </Col>
            </Row>
            <Row>
                <Col md="12" className="d-flex flex-column p-3">
                    <PrimeCard>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <>
                                <form>
                                    <FormGroup className={"d-flex flex-column gap-3"}>
                                        <div className={'d-flex flex-column gap-2'}>
                                            <Label for="custom-definitions-group-name">
                                                <Translate contentKey={'customDefinition.update.name'}>custom definitions Name</Translate>
                                            </Label>
                                            <InputText
                                                type="text"
                                                name="name"
                                                required={true}
                                                id="custom-definitions-group-name"
                                                value={customDefinition?.name || ''}
                                                onChange={handleChange}
                                                placeholder="Enter name"
                                            />
                                            <InputText
                                                type="text"
                                                name="description"
                                                required={true}
                                                id="custom-definitions-group-description"
                                                value={customDefinition?.description || ''}
                                                onChange={handleChange}
                                                placeholder="Enter description"
                                            />
                                            <InputText
                                                type="text"
                                                name="label"
                                                required={true}
                                                id="custom-definitions-group-label"
                                                value={customDefinition?.label || ''}
                                                onChange={handleChange}
                                                placeholder="Enter label"
                                            />
                                            <Select
                                                options={options}
                                                placeholder="Select a type"
                                                value={options.find(option => option.value === customDefinition?.type)}
                                                onChange={(e) => dispatch(changeEntityField({ name: 'type', value: e.value }))}
                                            />
                                            <div className='d-flex gap-2'>
                                                <Label htmlFor="authorities-checkbox">
                                                    <Translate contentKey={'customDefinition.update.required'}>Required</Translate>
                                                </Label>
                                                <Checkbox
                                                    id="custom-definitions-required-checkbox"
                                                    checked={customDefinition?.required}
                                                    onChange={e => dispatch(changeEntityField({ name: 'required', value: e.checked }))}
                                                />
                                            </div>
                                            <div className='d-flex gap-2'>
                                                <Label htmlFor="authorities-checkbox">
                                                    <Translate contentKey={'customDefinition.update.display'}>Display</Translate>
                                                </Label>
                                                <Checkbox
                                                    id="custom-definitions-display-checkbox"
                                                    checked={customDefinition?.display}
                                                    onChange={e => dispatch(changeEntityField({ name: 'display', value: e.checked }))}
                                                />
                                            </div>
                                        </div>

                                    </FormGroup>

                                    <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                                        <FontAwesomeIcon icon="arrow-left" />
                                        &nbsp;
                                        <span className="d-none d-md-inline">
                                            <Translate contentKey="entity.action.back">Back</Translate>
                                        </span>
                                    </Button>
                                    &nbsp;
                                    <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                                        <FontAwesomeIcon icon="save" />
                                        &nbsp;
                                        <Translate contentKey="entity.action.save">Save</Translate>
                                    </Button>
                                    &nbsp;
                                    <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                                        <FontAwesomeIcon icon="save" />
                                        &nbsp;
                                        <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                                    </Button>
                                </form>
                            </>
                        )}
                    </PrimeCard>
                </Col>
            </Row>
        </div>
    );
};

export default CustomDefinitionsUpdate;
