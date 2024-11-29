export interface ICourseDefinition {
    id?: string;
    name?: string;
    description?: string;
    order?: number;
}

export const defaultValue: Readonly<ICourseDefinition> = {};