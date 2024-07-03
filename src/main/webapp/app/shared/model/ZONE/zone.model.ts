export interface IZone {
    id?: string;
    name?: string;
    coordinates?: {
        x?: number; // longitude
        y?: number; // latitude
    }[];
}

export const defaultValue: Readonly<IZone> = {
    id: null,
    name: '',
    coordinates: [],
};