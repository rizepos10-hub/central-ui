import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { deleteEntity, getEntities } from './custom-definition-values.reducer';
import CustomDefinitionValuesUpdate from './custom-definition-values-update';
import { Dialog } from 'primereact/dialog';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { confirmDialog } from 'primereact/confirmdialog';


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

    console.log(entityId)

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

    const editColumnTemplate = rowData => {
        console.log(rowData)
        console.log(rowData?.id)
        return (
            <FontAwesomeIcon
                icon="pencil-alt"
                style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }}
                onClick={() => setDialogOptions({
                    visible: true,
                    customfieldValueId: rowData?.id
                })}
            />
        );
    };

    const confirm1 = (id) => {
        confirmDialog({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            accept: () => handleDeleteFieldValue(id),
            // reject
        });
    };

    const handleDeleteFieldValue = async (id) => {
        await dispatch(deleteEntity(id));
        getAllEntities();
    };

    const deleteColumnTemplate = rowData => {
        return (
            <FontAwesomeIcon
                icon="trash"
                style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }}
                onClick={() => confirm1(rowData.id)}
            />
        );
    };

    const handleCreate = () => {
        setDialogOptions({
            visible: true,
            customfieldValueId: ''
        })
    }

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">
                <Translate contentKey={'common.customDefinitions'}>Custom Definitions</Translate>
            </span>
            <div className="ms-auto">
                <Button
                    label={translate('common.create')}
                    raised
                    onClick={handleCreate}
                    disabled={loading}
                    type='button'
                />
            </div>
        </div>
    );

    return (
        <div>
            <Dialog
                header="Custom Fields"
                visible={dialogOptions.visible}
                onHide={() => {
                    setDialogOptions({
                        visible: false,
                        customfieldValueId: ''
                    });
                }}
                style={{
                    height: '70vh',
                    width: '50vw',
                }}
            >
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
            </Dialog>
            <DataTable
                value={customDefinitionValues}
                editMode="row"
                removableSort
                filterDisplay="row"
                totalRecords={totalItems}
                rows={1000}
                lazy
                first={0}
                loading={loading}
                header={header}
                showGridlines
            >
                <Column field="definition.name" header={translate('common.definitionName')} />
                <Column field="value" header={translate('common.value')} />
                <Column
                    header={translate('common.edit')}
                    body={editColumnTemplate}
                    headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
                    bodyStyle={{ textAlign: '-moz-initial', overflow: 'dialogOptions' }}
                />

                <Column
                    header={translate('common.delete')}
                    body={deleteColumnTemplate}
                    headerStyle={{ width: '1%' }}
                    bodyStyle={{ textAlign: '-moz-initial', overflow: 'dialogOptions' }}
                />
            </DataTable>
        </div>
    );
};

export default CustomDefinitionValues;
