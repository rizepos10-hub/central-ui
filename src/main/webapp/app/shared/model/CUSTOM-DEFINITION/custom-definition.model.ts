export interface ICustomDefinition {
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    label?: string;
    required?: boolean;
    display?: boolean;
}

export enum CustomDefinitionType {
    BOOLEAN = 'BOOLEAN',
    STRING = 'STRING',
    INTEGER = 'INTEGER',
    DOUBLE = 'DOUBLE',
    DATE = 'DATE',
}

export const defaultValue: Readonly<ICustomDefinition> = {
    name: '',
    description: '',
    type: CustomDefinitionType.STRING,
    label: '',
    required: false,
    display: false
};