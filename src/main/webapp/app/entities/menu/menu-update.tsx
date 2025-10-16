import React, { useEffect } from 'react';
import { Translate, translate } from 'react-jhipster';
import Select from 'react-select';
import { Save, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IMenu } from 'app/shared/model/menu.model';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { useParams } from 'react-router-dom';
import { getEntity } from './menu.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { IAttachment } from 'app/shared/model/attachment.model';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const MenuUpdate = ({
    setIsModalOpen,
    isModalOpen,
    saveEntity,
    updating,
    selectedBranches,
    setSelectedBranches,
    selectedName,
    setSelectedName,
    selectedAttachment,
    setSelectedAttachment,
    isNew,
}: {
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isModalOpen: boolean;
    saveEntity: () => void;
    updating: any;
    selectedBranches: IBranch[];
    setSelectedBranches: React.Dispatch<React.SetStateAction<IBranch[]>>;
    selectedName: string;
    setSelectedName: React.Dispatch<React.SetStateAction<string>>;
    selectedAttachment: IAttachment;
    setSelectedAttachment: React.Dispatch<React.SetStateAction<IAttachment>>;
    isNew?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const { id } = useParams<'id'>();

    const menuEntity = useAppSelector(state => state.menu.entity);
    const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

    useEffect(() => {
        dispatch(getBranches({}));
        if (!id || isNew) return;
        dispatch(getEntity({ id })).then((res) => {
            // @ts-expect-error -- unknown type
            if (res.payload?.data?.name) {
                // @ts-expect-error -- unknown type
                setSelectedName(res.payload?.data?.name);
            }
        });
    }, [id, isNew]);

    useEffect(() => {
        if (isNew) return;
        setSelectedBranches(menuEntity?.branches);
        setSelectedAttachment(menuEntity?.image);
        setSelectedName(menuEntity?.name);
    }, [menuEntity, isNew]);

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl p-3">
                <DialogHeader className="p-2">
                    <DialogTitle className="text-sm font-semibold">
                        <Translate contentKey={isNew ? "menus.shared.update.create.title" : "menus.shared.update.edit.title"}>
                            {isNew ? 'Create Menu' : 'Edit Menu'}
                        </Translate>
                    </DialogTitle>
                </DialogHeader>

                <form className="space-y-2 px-2">
                    <div className="space-y-1">
                        <Label htmlFor="menu-name" className="text-xs">
                            {translate('menus.shared.update.name')}
                        </Label>
                        <Input
                            id="menu-name"
                            name="name"
                            data-cy="name"
                            type="text"
                            value={selectedName}
                            onChange={(e) => setSelectedName(e.target.value)}
                            className="h-8 text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="branch" className="text-xs">
                            {translate('menus.shared.update.branches')}
                        </Label>
                        <Select
                            onChange={(selected) => {
                                setSelectedBranches(
                                    (selected || []).map((branch) => ({
                                        id: branch.id,
                                        name: branch.name,
                                    }))
                                );
                            }}
                            options={branchList}
                            value={selectedBranches}
                            getOptionLabel={(branch) => branch.name || ''}
                            getOptionValue={(branch) => branch.id || ''}
                            name="branch"
                            id="branch"
                            data-cy="branch"
                            isMulti
                            isClearable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '32px',
                                    fontSize: '0.75rem',
                                }),
                                option: (base) => ({
                                    ...base,
                                    fontSize: '0.75rem',
                                }),
                            }}
                        />
                    </div>

                    <div className="space-y-1">
                        <MediaLibrary
                            handleFilesSelectCallback={(files) => setSelectedAttachment(transformAttachmentStructure(files, 'toIAttachment')[0])}
                            defaultValues={selectedAttachment ? transformAttachmentStructure([selectedAttachment], 'toFileLibraryListItem') : []}
                        />
                    </div>

                    <DialogFooter className="gap-1 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModalOpen(false)}
                            className="h-8 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            <Translate contentKey="entity.action.back">Back</Translate>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={saveEntity}
                            disabled={updating}
                            className="h-8 text-xs"
                        >
                            <Save className="h-3 w-3 mr-1" />
                            <Translate contentKey="entity.action.save">Save</Translate>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MenuUpdate;
