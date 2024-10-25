import React, { useState, useEffect, useRef } from 'react'
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
    const formRef = useRef<HTMLFormElement>(null)
    const [isFormValid, setIsFormValid] = useState(false)

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
            dispatch(changeEntityField({
                // @ts-expect-error -- special case
                name: '', value: {
                    ...defaultValue
                }
            }))
        }
    }, [customFieldValueId, definitions])

    useEffect(() => {
        if (formRef.current) {
            setIsFormValid(formRef.current.checkValidity())
        }
    }, [definitionValue, entityId, definitions])

    const renderPrimeComponent = () => {
        if (!fieldValue.definition?.id) return null

        switch (fieldValue.definition.type) {
            case CustomDefinitionType.BOOLEAN:
                return (
                    <Dropdown
                        value={definitionValue?.value}
                        options={[{ label: 'True', value: true }, { label: 'False', value: false }]}
                        onChange={e => {
                            dispatch(changeEntityField({ name: 'value', value: e.value }))
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        placeholder="Select True/False"
                        required
                    />
                )
            case CustomDefinitionType.STRING:
                return (
                    <InputText
                        value={definitionValue?.value}
                        onChange={(e) => {
                            dispatch(changeEntityField({ name: 'value', value: e.target.value }))
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        placeholder="Enter text"
                        required
                    />
                )
            case CustomDefinitionType.INTEGER:
                return (
                    <InputNumber
                        value={definitionValue?.value}
                        onValueChange={(e) => {
                            dispatch(changeEntityField({ name: 'value', value: e.value }))
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        placeholder="Enter integer"
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={0}
                        required
                    />
                )
            case CustomDefinitionType.DOUBLE:
                return (
                    <InputNumber
                        value={definitionValue?.value}
                        onValueChange={(e) => {
                            dispatch(changeEntityField({ name: 'value', value: e.value }))
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        placeholder="Enter number with decimal"
                        mode="decimal"
                        minFractionDigits={1}
                        maxFractionDigits={5}
                        required
                    />
                )
            case CustomDefinitionType.DATE:
                return (
                    <Calendar
                        value={definitionValue?.value}
                        onChange={(e) => {
                            dispatch(changeEntityField({ name: 'value', value: e.value }))
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        placeholder="Select date"
                        required
                    />
                )
            default:
                return null
        }
    }

    const handleSave = (e) => {
        e.preventDefault()

        if (!isFormValid) return

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
        <form ref={formRef} onSubmit={handleSave}>
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
                            setIsFormValid(formRef.current?.checkValidity() ?? false)
                        }}
                        required
                    />
                    <div className="prime-component">
                        {renderPrimeComponent()}
                    </div>
                </div>
                <div className='d-flex justify-content-end'>
                    <Button
                        label="Save"
                        icon="pi pi-save"
                        disabled={!isFormValid}
                    />
                </div>
            </div>
        </form>
    )
}

export default CustomDefinitionValuesUpdate
