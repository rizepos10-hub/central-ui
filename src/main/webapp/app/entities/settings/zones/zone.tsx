import { ControlPosition, Map, MapControl } from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { UndoRedoControl } from 'app/shared/components/google/undo-redo-control';
import { IZone } from 'app/shared/model/ZONE/zone.model';
import { InputText } from 'primereact/inputtext'
import React, { useCallback, useEffect, useMemo } from 'react'
import { changeEntityField, createEntity, deleteEntity, getEntity, reset, updateEntity } from './zones.reducer';
import { PolygonPath, useDrawingManager } from 'app/shared/components/google/hooks/use-drawing-manager';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card, CardHeader, Col } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from 'react-jhipster';

const ZonePage = () => {
    const params = useParams();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const isNew = params?.id === undefined;

    const zone: IZone = useAppSelector(state => state.zones.entity);
    const loading = useAppSelector(state => state.zones.loading);

    const handlePolygonPath = useCallback((path: PolygonPath[]) => {
        dispatch(changeEntityField({ fieldName: 'coordinates', value: path }))
    }, [dispatch]);

    const defaultLatLngs = useMemo(() => zone?.coordinates?.map(coord => ({
        lat: coord.y,
        lng: coord.x
    })), [zone.coordinates]);

    const drawingManager = useDrawingManager(null, handlePolygonPath, defaultLatLngs);


    useEffect(() => {
        if (isNew) {
            dispatch(reset());
        } else {
            dispatch(getEntity(params?.id));
        }
    }, [isNew, params?.id, dispatch]);

    const saveEntity = (e, createNew = false) => {
        e.preventDefault();
        const entity = {
            ...zone,
            coordinates: defaultLatLngs.map(latlng => ({
                x: latlng.lng,
                y: latlng.lat
            })),
        };

        if (isNew) {
            dispatch(createEntity(entity)).then((res) => {
                if (createNew) {
                    dispatch(reset());
                } else {
                    const payload = res?.payload as any;
                    const newId = payload?.data?.id;
                    navigate(`/zones/${newId}/edit`)
                }
            })
        } else {
            dispatch(updateEntity(entity)).then(() => {
                if (createNew) {
                    navigate(`/zones/new`)
                }
            })
        }
    };

    const deleteZone = (id) => {
        const alret = window.confirm("Are you sure you want to delete this zone?");
        if (!alret) return;
        dispatch(deleteEntity(id)).then(() => (
            navigate(-1)
        ));
    };

    return (
        <form onSubmit={saveEntity} className='d-flex flex-column gap-4'>
            <div className='d-flex gap-4'>
                <div>
                    <Map
                        defaultZoom={3}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        style={{ width: '600px', height: '600px' }}
                    />

                    <MapControl position={ControlPosition.TOP_CENTER}>
                        <UndoRedoControl drawingManager={drawingManager} />
                    </MapControl>
                </div>
                <div className='d-flex flex-column gap-2'>
                    <div className='d-flex flex-column gap-2'>
                        <label className='fw-semibold' htmlFor="name">Name</label>
                        <InputText
                            id="name"
                            value={zone.name || ''}
                            onChange={(e) => dispatch(changeEntityField({ fieldName: 'name', value: e.target.value }))}
                            required
                            placeholder='Enter Zone Name'
                        />
                    </div>
                    {!isNew ? (
                        <div className='d-flex flex-column gap-2'>
                            <label className='fw-semibold'>Delete this zone</label>
                            <Button
                                label="Delete Zone"
                                className="p-button-danger p-1"
                                type='button'
                                size='large'
                                onClick={() => deleteZone(zone.id)}
                            />
                        </div>

                    ) : (
                        <div></div>
                    )}
                </div>
            </div >
            <div>
                <div className={'d-flex gap-3 mt-2'}>
                    <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                        <FontAwesomeIcon icon="arrow-left" />
                        &nbsp;
                        <span className="d-none d-md-inline">
                            <Translate contentKey="entity.action.back">Back</Translate>
                        </span>
                    </Button>
                    &nbsp;
                    <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit">
                        <FontAwesomeIcon icon="save" />
                        &nbsp;
                        <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                    &nbsp;
                    <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit">
                        <FontAwesomeIcon icon="save" />
                        &nbsp;
                        <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                    </Button>
                </div>
            </div>
        </form >
    )
}

export default ZonePage