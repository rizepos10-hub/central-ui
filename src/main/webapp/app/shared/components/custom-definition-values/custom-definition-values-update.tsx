import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'app/config/store'
import { getEntities as getCustomDefinitions } from 'app/entities/settings/custom-definitions/custom-definitions.reducer'
import { CustomDefinitionEntityType, ICustomDefinitionValue } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model'
import { ICustomDefinition, CustomDefinitionType, defaultValue } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition.model'
import Select from 'react-select'
import { InputText } from 'primereact/inputtext'
import { Calendar } from 'primereact/calendar'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { changeEntityField, createEntity, getEntity, updateEntity } from './custom-definition-values.reducer'
import { Button } from 'primereact/button'

const CustomDefinitionValuesUpdate = ({
    entityType,
    entityId,
    onSave,
    customFieldValueId
}: {
    entityType: CustomDefinitionEntityType
    entityId: string
    onSave: () => void
    customFieldValueId?: string
}) => {
    const dispatch = useAppDispatch()
    const fieldValue: ICustomDefinitionValue = useAppSelector(state => state.customDefinitionValues.entity)
    const definitions: ICustomDefinition[] = useAppSelector(state => state.customDefinitions.entities)
    const definitionValue: ICustomDefinitionValue = useAppSelector(state => state.customDefinitionValues.entity)


    useEffect(() => {
        dispatch(getCustomDefinitions({
            page: 0,
            size: 1000,
            sort: 'name,asc',
        }))
    }, [dispatch])

    useEffect(() => {
        if (customFieldValueId) {
            dispatch(getEntity(customFieldValueId))
        } else {
            // @ts-expect-error -- special case
            dispatch(changeEntityField({ name: '', value: {
                ...defaultValue,
                id: '',
            } }))
        }
    }, [customFieldValueId, definitions])

    const renderPrimeComponent = () => {
        if (!fieldValue.definition?.id) return null

        switch (fieldValue.definition.type) {
            case CustomDefinitionType.BOOLEAN:
                return (
                    <Dropdown
                        value={definitionValue?.value}
                        options={[{ label: 'True', value: true }, { label: 'False', value: false }]}
                        onChange={e => dispatch(changeEntityField({ name: 'value', value: e.value }))}
                        placeholder="Select True/False"
                    />
                )
            case CustomDefinitionType.STRING:
                return (
                    <InputText
                        value={definitionValue?.value}
                        onChange={(e) => dispatch(changeEntityField({ name: 'value', value: e.target.value }))}
                        placeholder="Enter text"
                    />
                )
            case CustomDefinitionType.INTEGER:
                return (
                    <InputNumber
                        value={definitionValue?.value}
                        onValueChange={(e) => dispatch(changeEntityField({ name: 'value', value: e.value }))}
                        placeholder="Enter integer"
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={0}
                    />
                )
            case CustomDefinitionType.DOUBLE:
                return (
                    <InputNumber
                        value={definitionValue?.value}
                        onValueChange={(e) => dispatch(changeEntityField({ name: 'value', value: e.value }))}
                        placeholder="Enter number with decimal"
                        mode="decimal"
                        minFractionDigits={1}
                        maxFractionDigits={5}
                    />
                )
            case CustomDefinitionType.DATE:
                return (
                    <Calendar
                        value={definitionValue?.value}
                        onChange={(e) => dispatch(changeEntityField({ name: 'value', value: e.value }))}
                        placeholder="Select date"
                    />
                )
            default:
                return null
        }
    }

    const handleSave = () => {
        const entity: ICustomDefinitionValue = {
            ...definitionValue,
            entityId,
            entityType,
            definition: fieldValue.definition
        }

        if (customFieldValueId) {
            dispatch(updateEntity(entity)).then(() => {
                onSave()
            })
        } else {
            dispatch(createEntity(entity)).then(() => {
                onSave()
            })
        }
    }

    return (
        <div className='d-flex flex-column justify-content-between gap-2 h-100'>
            <div className='d-flex flex-column gap-2'>
                <Select
                    options={definitions.map(definition => ({
                        value: definition?.id,
                        label: definition?.name
                    }))}
                    placeholder="Select a definition"
                    value={fieldValue.definition ? { value: fieldValue.definition?.id, label: fieldValue.definition?.name } : null}
                    onChange={e => {
                        const newDef = definitions.find(def => def.id === e.value)
                        dispatch(changeEntityField({ name: 'definition', value: newDef }))
                    }}
                />
                <div className="prime-component">
                    {renderPrimeComponent()}
                </div>
            </div>
            <div className='d-flex justify-content-end'>
                <Button
                    onClick={handleSave}
                    label="Save"
                    icon="pi pi-save"
                />
            </div>
        </div>
    )
}

export default CustomDefinitionValuesUpdate
