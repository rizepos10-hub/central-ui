import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate, } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset, getEntities } from './custom-definitions.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { CustomDefinitionType, ICustomDefinition } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition.model';

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
        <PageWrapper>
            <div className="space-y-4">
                <h2 className="text-xl font-bold">
                    {isNew ? (
                        <Translate contentKey={'customDefinition.update.create.title'}>Create New custom Definition</Translate>
                    ) : (
                        <Translate contentKey={'customDefinition.update.edit.title'}>Edit custom Definition Group</Translate>
                    )}
                </h2>

                {loading ? (
                    <p className="text-xs">Loading...</p>
                ) : (
                    <form  className="space-y-4">
                        <div className="bg-white p-4 rounded-md border space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-definitions-group-name" className="text-xs font-semibold">
                                    <Translate contentKey={'customDefinition.update.name'}>custom definitions Name</Translate>
                                    <span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    name="name"
                                    required={true}
                                    id="custom-definitions-group-name"
                                    value={customDefinition?.name || ''}
                                    onChange={handleChange}
                                    placeholder="Enter name"
                                    className="h-7 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-definitions-group-description" className="text-xs font-semibold">
                                    <Translate contentKey={'customDefinition.update.description'}>Description</Translate>
                                    <span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    name="description"
                                    required={true}
                                    id="custom-definitions-group-description"
                                    value={customDefinition?.description || ''}
                                    onChange={handleChange}
                                    placeholder="Enter description"
                                    className="h-7 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-definitions-group-label" className="text-xs font-semibold">
                                    <Translate contentKey={'customDefinition.update.label'}>Label</Translate>
                                    <span className="text-destructive ml-1">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    name="label"
                                    required={true}
                                    id="custom-definitions-group-label"
                                    value={customDefinition?.label || ''}
                                    onChange={handleChange}
                                    placeholder="Enter label"
                                    className="h-7 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-definitions-type" className="text-xs font-semibold">
                                    <Translate contentKey={'customDefinition.update.type'}>Type</Translate>
                                </Label>
                                <Select
                                    value={customDefinition?.type || ''}
                                    onValueChange={(value) => dispatch(changeEntityField({ name: 'type', value }))}
                                >
                                    <SelectTrigger id="custom-definitions-type" className="h-7 text-xs">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.map(option => (
                                            <SelectItem key={option.value} value={option.value} className="text-xs">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="custom-definitions-required-checkbox"
                                    checked={customDefinition?.required || false}
                                    onCheckedChange={(checked) => dispatch(changeEntityField({ name: 'required', value: checked === true }))}
                                />
                                <Label htmlFor="custom-definitions-required-checkbox" className="text-xs font-normal cursor-pointer">
                                    <Translate contentKey={'customDefinition.update.required'}>Required</Translate>
                                </Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="custom-definitions-display-checkbox"
                                    checked={customDefinition?.display || false}
                                    onCheckedChange={(checked) => dispatch(changeEntityField({ name: 'display', value: checked === true }))}
                                />
                                <Label htmlFor="custom-definitions-display-checkbox" className="text-xs font-normal cursor-pointer">
                                    <Translate contentKey={'customDefinition.update.display'}>Display</Translate>
                                </Label>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => navigate(-1)}
                                type="button"
                                className="h-8 text-xs"
                                id="cancel-save"
                                data-cy="entityCreateCancelButton"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                <Translate contentKey="entity.action.back">Back</Translate>
                            </Button>
                            <Button
                                type="button"
                                disabled={updating}
                                className="h-8 text-xs"
                                id="save-entity"
                                data-cy="entityCreateSaveButton"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                <Translate contentKey="entity.action.save">Save</Translate>
                            </Button>
                            <Button
                                onClick={(e) => saveEntity(e, true)}
                                disabled={updating}
                                className="h-8 text-xs"
                                type="button"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </PageWrapper>
    );
};

export default CustomDefinitionsUpdate;
