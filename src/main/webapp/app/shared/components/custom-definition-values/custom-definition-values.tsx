import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { deleteEntity, getEntities } from './custom-definition-values.reducer';
import CustomDefinitionValuesUpdate from './custom-definition-values-update';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Plus } from 'lucide-react';


export const CustomDefinitionValues = ({
    entityId,
    entityType
}: {
    entityId: string;
    entityType: CustomDefinitionEntityType;
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const customDefinitionValues = useAppSelector(state => state.customDefinitionValues.entities);
    const loading = useAppSelector(state => state.customDefinitionValues.loading);
    const totalItems = useAppSelector(state => state.customDefinitionValues.totalItems);

    const [dialogOptions, setDialogOptions] = useState<{
        visible: boolean;
        customfieldValueId: string;
    }>({
        visible: false,
        customfieldValueId: ''
    });

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const getAllEntities = () => {
        dispatch(getEntities({
            page: 0,
            size: 1000,
            sort: 'id,asc',
            entityId,
            entityType
        }))
    }

    useEffect(() => {
        getAllEntities()
    }, [entityId, entityType]);

    const confirm1 = (id) => {
        setItemToDelete(id);
        setShowDeleteDialog(true);
    };

    const handleDeleteFieldValue = async () => {
        if (itemToDelete) {
            await dispatch(deleteEntity(itemToDelete));
            getAllEntities();
            setItemToDelete(null);
            setShowDeleteDialog(false);
        }
    };

    const handleCreate = () => {
        setDialogOptions({
            visible: true,
            customfieldValueId: ''
        })
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-base font-bold">
                    <Translate contentKey={'common.customDefinitions'}>Custom Definitions</Translate>
                </span>
                <Button
                    onClick={handleCreate}
                    disabled={loading}
                    type='button'
                    size="sm"
                    className="h-8 text-xs"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {translate('common.create')}
                </Button>
            </div>

            <Dialog
                open={dialogOptions.visible}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogOptions({
                            visible: false,
                            customfieldValueId: ''
                        });
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base">Custom Fields</DialogTitle>
                    </DialogHeader>
                    <CustomDefinitionValuesUpdate
                        entityType={entityType}
                        entityId={entityId}
                        onSave={() => {
                            getAllEntities()
                            setDialogOptions({
                                visible: false,
                                customfieldValueId: ''
                            })
                        }}
                        customFieldValueId={dialogOptions.customfieldValueId}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="h-8 text-xs">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFieldValue} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="border rounded">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="text-xs h-8 font-semibold p-2">
                                {translate('common.definitionName')}
                            </TableHead>
                            <TableHead className="text-xs h-8 font-semibold p-2">
                                {translate('common.value')}
                            </TableHead>
                            <TableHead className="text-xs h-8 font-semibold p-2 w-20">
                                {translate('common.edit')}
                            </TableHead>
                            <TableHead className="text-xs h-8 font-semibold p-2 w-20">
                                {translate('common.delete')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customDefinitionValues.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-xs p-4 text-muted-foreground">
                                    {loading ? 'Loading...' : 'No custom definitions found'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            customDefinitionValues.map((rowData) => (
                                <TableRow key={rowData.id}>
                                    <TableCell className="text-xs p-2">{rowData.definition?.name}</TableCell>
                                    <TableCell className="text-xs p-2">{rowData.value}</TableCell>
                                    <TableCell className="text-xs p-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setDialogOptions({
                                                visible: true,
                                                customfieldValueId: rowData?.id
                                            })}
                                        >
                                            <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-xs p-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => confirm1(rowData.id)}
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CustomDefinitionValues;
