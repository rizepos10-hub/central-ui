import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import React from 'react'
import CustomDefinitionValues from './custom-definition-values';

const CustomDefinitionValuesWrapper = ({
    entityType,
    entityId,
}: {
    entityType: CustomDefinitionEntityType
    entityId: string
}) => {
    if (!entityId) return null

    return (
        <>
            <CustomDefinitionValues
                entityType={entityType}
                entityId={entityId}
            />
        </>
    )
}

export default CustomDefinitionValuesWrapper
