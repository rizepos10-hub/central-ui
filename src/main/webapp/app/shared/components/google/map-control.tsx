import React from 'react';
import { ControlPosition, MapControl } from '@vis.gl/react-google-maps';

import { PlaceAutocompleteClassic } from './autocomplete-classic';

export type AutocompleteMode = { id: string; label: string };

export const autocompleteModes: Array<AutocompleteMode> = [
    { id: 'classic', label: 'Google Autocomplete Widget' },
];


type CustomAutocompleteControlProps = {
    controlPosition: ControlPosition;
    selectedAutocompleteMode: AutocompleteMode;
    onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
};

export const CustomMapControl = ({
    controlPosition,
    selectedAutocompleteMode,
    onPlaceSelect
}: CustomAutocompleteControlProps) => {
    const { id } = selectedAutocompleteMode;

    return (
        <MapControl position={controlPosition}>
            <div className="autocomplete-control">
                {id === 'classic' && (
                    <PlaceAutocompleteClassic onPlaceSelect={onPlaceSelect} />
                )}
            </div>
        </MapControl>
    );
};
