import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {
    getEntity,
    updateEntity,
    createEntity,
    reset,
    deleteEntity,
    getEntities as categoryEntitiesTree,
    searchEntities as categorySearchEntitiesTree,
    changeEntityField,
} from './retail-item-category-tree.reducer';

import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import Select from 'app/shared/components/select/select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { ITerm } from 'app/shared/model/term.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RotateCcw, Save, Trash2 } from 'lucide-react';

interface UpdateItemRetailCategoryTreeProps {
    categories?: [];
    onSave?: (load?: boolean) => void;
}

export const UpdateItemRetailCategoryTree: React.FC<UpdateItemRetailCategoryTreeProps> = ({ onSave }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParam, setSearchParams] = useSearchParams();

    const { id } = useParams<'id'>();
    const isNew = id === undefined && !searchParam.get("categoryId");
    const categories = useAppSelector(state => state.retailCategoryTree.entities);
    const categoryEntity: ITerm = useAppSelector(state => state.retailCategoryTree.entity);
    const updating = useAppSelector(state => state.retailCategoryTree.updating);
    const updateSuccess = useAppSelector(state => state.retailCategoryTree.updateSuccess);
    const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);
    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [localVisibility, setLocalVisibility] = useState<any[]>([]);

    useEffect(() => {
        if (isNew) {
            dispatch(reset());
        } else {
            const entityId = id || searchParam.get("categoryId");
            if (entityId) {
                dispatch(getEntity(entityId));
            }
        }

        dispatch(
            getProfileGroups({
                page: paginationState.activePage - 1,
                size: paginationState.itemsPerPage,
                sort: `${paginationState.sort},${paginationState.order}`,
            })
        );

        dispatch(
            categoryEntitiesTree({
                page: paginationState.activePage - 1,
                size: paginationState.itemsPerPage,
                sort: `${paginationState.sort},${paginationState.order}`,
            })
        );
    }, [searchParam.get("categoryId")]);

    useEffect(() => {
        if (categoryEntity) {
            const defaultVisibility = [
                { application: SourceType.BRANCH_POS, visible: true, schedule: {} },
                { application: SourceType.ONLINE_ORDERING, visible: true, schedule: {} },
            ];
            if (Array.isArray(categoryEntity.visibility)) {
                const mergedVisibility = defaultVisibility.map(defaultItem => {
                    const existing = categoryEntity.visibility.find(
                        (item: any) => item.application === defaultItem.application
                    );
                    return existing !== undefined ? existing : defaultItem;
                });
                setLocalVisibility(mergedVisibility);
            } else {
                setLocalVisibility(defaultVisibility);
            }
        }
    }, [categoryEntity]);

    const handleProfileGroupsChange = (profileGroups) => {
        dispatch(
            changeEntityField({
                name: 'accountingGroups',
                value: [profileGroups],
            })
        );
    };

    const handleParentsChange = (selectedParent) => {
        dispatch(
            changeEntityField({
                name: 'parents',
                value: selectedParent ? [selectedParent] : [],
            })
        );
    };

    const handleSearch = (inputValue) => {
        dispatch(
            categorySearchEntitiesTree({
                query: inputValue,
                page: paginationState.activePage - 1,
                size: paginationState.itemsPerPage,
                sort: `${paginationState.sort},${paginationState.order}`,
            })
        );
    };

    const saveEntity = (e, createNew = false) => {
        e.preventDefault();
        const entity = {
            ...categoryEntity,
            visibility: localVisibility,
        };

        if (isNew) {
            dispatch(createEntity(entity)).then(() => {
                dispatch(reset());
                onSave && onSave();
            });
        } else {
            dispatch(updateEntity(entity)).then(() => {
                onSave && onSave();
            });
        }
    };

    const removeEntity = () => {
        const entity = { ...categoryEntity };
        dispatch(deleteEntity(entity.id)).then(() => {
            dispatch(reset());
            onSave && onSave();
        });
        setShowDeleteDialog(false);
    };

    const resetData = () => {
        dispatch(reset());
        searchParam.delete("categoryId");
        setSearchParams(searchParam)
        onSave && onSave();
    };

    const confirmDelete = (e) => {
        e.preventDefault();
        setShowDeleteDialog(true);
    };

    return (
        <div className="fixed w-1/2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {isNew ? (
                            <Translate contentKey={'itemCategories.update.retail.create.title'} />
                        ) : (
                            <Translate contentKey={'itemCategories.update.retail.edit.title'} />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form  className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name" className="text-xs">
                                <Translate contentKey="itemCategories.update.name">Name</Translate>
                            </Label>
                            <Input
                                name="name"
                                id="category-name"
                                required
                                value={categoryEntity.name || ''}
                                onChange={(e) =>
                                    dispatch(changeEntityField({ name: 'name', value: e.target.value }))
                                }
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">
                                <Translate contentKey="itemCategories.update.profileGroups">Profile Groups</Translate>
                            </Label>
                            <Select
                                value={categoryEntity.accountingGroups || []}
                                isClearable
                                onChange={handleProfileGroupsChange}
                                options={profileGroupsOptions}
                                getOptionLabel={(option) => option.name}
                                getOptionValue={(option) => option.id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">
                                <Translate contentKey="itemCategories.update.parents">Parents</Translate>
                            </Label>
                            <Select
                                value={categoryEntity?.parents || []}
                                isClearable
                                onChange={handleParentsChange}
                                options={categories}
                                getOptionLabel={(option) => option.name}
                                getOptionValue={(option) => option.id}
                                onInputChange={handleSearch}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">
                                <Translate contentKey="itemCategories.update.image">Image</Translate>
                            </Label>
                            <MediaLibrary
                                handleFilesSelectCallback={(files) => {
                                    const newAttachment = transformAttachmentStructure(files, 'toIAttachment')[0];
                                    dispatch(
                                        changeEntityField({
                                            name: 'attachments',
                                            value: newAttachment ? [newAttachment] : [],
                                        })
                                    );
                                }}
                                defaultValues={transformAttachmentStructure(
                                    categoryEntity?.attachments || [],
                                    'toFileLibraryListItem'
                                )}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">Visibility</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="visibility-pos"
                                        checked={
                                            localVisibility.find((v: any) => v.application === SourceType.BRANCH_POS)
                                                ?.visible !== false
                                        }
                                        onCheckedChange={(checked) =>
                                            setLocalVisibility((prev) =>
                                                prev.map((item) =>
                                                    item.application === SourceType.BRANCH_POS
                                                        ? { ...item, visible: checked as boolean }
                                                        : item
                                                )
                                            )
                                        }
                                    />
                                    <Label htmlFor="visibility-pos" className="text-xs font-normal cursor-pointer">
                                        POS
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="visibility-online"
                                        checked={
                                            localVisibility.find((v: any) => v.application === SourceType.ONLINE_ORDERING)
                                                ?.visible !== false
                                        }
                                        onCheckedChange={(checked) =>
                                            setLocalVisibility((prev) =>
                                                prev.map((item) =>
                                                    item.application === SourceType.ONLINE_ORDERING
                                                        ? { ...item, visible: checked as boolean }
                                                        : item
                                                )
                                            )
                                        }
                                    />
                                    <Label htmlFor="visibility-online" className="text-xs font-normal cursor-pointer">
                                        Online Ordering
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={resetData}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                <Translate contentKey="entity.action.reset">Reset</Translate>
                            </Button>
                            <Button onClick={saveEntity} type="submit" size="sm" className="h-8 text-xs" disabled={updating}>
                                <Save className="h-4 w-4 mr-2" />
                                <Translate contentKey="entity.action.save">Save</Translate>
                            </Button>
                            {!isNew && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={confirmDelete}
                                    disabled={updating}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <Translate contentKey="entity.action.delete">Delete</Translate>
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base">Delete Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            Do you want to delete this record? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={removeEntity} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UpdateItemRetailCategoryTree;
