import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export interface PolygonPath {
    x: number;
    y: number;
}

type NewPolygonCallback = (path: PolygonPath[]) => void;

export function useDrawingManager(
    initialValue: google.maps.drawing.DrawingManager | null = null,
    onNewPolygon?: NewPolygonCallback,
    defaultLatLngs: google.maps.LatLngLiteral[] = []
): google.maps.drawing.DrawingManager | null {
    const map = useMap();
    const drawing = useMapsLibrary('drawing');

    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(initialValue);

    useEffect(() => {
        if (map && defaultLatLngs.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            defaultLatLngs.forEach(latlng => bounds.extend(latlng));
            map.fitBounds(bounds);
        }
    }, [map, defaultLatLngs]);

    useEffect(() => {
        if (!map) return;

        const polygon = new google.maps.Polygon({
            paths: defaultLatLngs,
            editable: true,
            draggable: true,
            map,
        });

        return () => polygon.setMap(null);
    }, [map, defaultLatLngs]);

    useEffect(() => {
        if (!map || !drawing) return;

        const newDrawingManager = new google.maps.drawing.DrawingManager({
            map,
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
                editable: true,
                draggable: true
            },
        });

        const overlayCompleteHandler = (event: google.maps.drawing.OverlayCompleteEvent) => {
            if (event.type === google.maps.drawing.OverlayType.POLYGON) {
                const newPolygon = event.overlay as google.maps.Polygon;
                const path = newPolygon.getPath().getArray().map(latlng => ({
                    y: latlng.lat(),
                    x: latlng.lng()
                }));

                onNewPolygon?.(path);
            }
        };

        newDrawingManager.addListener('overlaycomplete', overlayCompleteHandler);

        setDrawingManager(newDrawingManager);

        return () => {
            newDrawingManager.setMap(null);
            google.maps.event.clearInstanceListeners(newDrawingManager);
        };
    }, [drawing, map, onNewPolygon, defaultLatLngs]);

    return drawingManager;
}
